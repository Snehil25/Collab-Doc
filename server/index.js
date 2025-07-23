require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const supabase = require('./db');
const authMiddleware = require('./middleware/auth');
const jwt = require('jsonwebtoken');


const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://collab-doc-snehils-projects-4954fa41.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    console.log("Incoming request origin:", origin);

    if (!origin) return callback(null, true);

    // Allow all *.vercel.app subdomains
    if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.snehils-projects-4954fa41.vercel.app')
        )
        {
      return callback(null, true);
    }

    const msg = `CORS error: ${origin} not allowed`;
    console.error(msg);
    return callback(new Error(msg), false);
  }
};


app.use(cors(corsOptions));


app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: corsOptions
});

app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => {
  res.send('Backend server is live and running!');
});

app.get("/api/documents", authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.rpc('get_documents_for_user', {
            user_id_param: req.user.id
        });
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Error fetching documents:", err);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});

app.post("/api/documents", authMiddleware, async (req, res) => {
    try {
        const defaultValue = "";
        const { data, error } = await supabase
            .from('documents')
            .insert({
                content: defaultValue,
                history: [defaultValue],
                user_id: req.user.id
            })
            .select('id')
            .single();
        if (error) throw error;
        res.status(201).json({ id: data.id });
    } catch (err) {
        console.error("Error creating document:", err);
        res.status(500).json({ error: "Failed to create document" });
    }
});

app.post("/api/documents/:id/share", authMiddleware, async (req, res) => {
    const { id: documentId } = req.params;
    const { email: collaboratorEmail } = req.body;
    const ownerId = req.user.id;

    try {
        const { data: accessibleDocs, error: rpcError } = await supabase.rpc('get_documents_for_user', {
            user_id_param: ownerId
        });

        if (rpcError) {
            console.error('[SHARE] RPC error:', rpcError);
            return res.status(500).json({ msg: 'Server error checking document permissions.' });
        }

        const targetDoc = accessibleDocs.find(doc => doc.id === documentId);

        if (!targetDoc) {
            return res.status(404).json({ msg: 'Document not found.' });
        }

        if (targetDoc.owner_email !== req.user.email) {
            return res.status(403).json({ msg: 'Only the document owner can share.' });
        }

        const adminUsersUrl = `${process.env.SUPABASE_URL}/auth/v1/admin/users`;
        const adminAuthHeaders = {
            'apikey': process.env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        };

        const response = await fetch(adminUsersUrl, { headers: adminAuthHeaders });
        if (!response.ok) {
            throw new Error('Could not fetch users from Supabase admin API.');
        }

        const { users } = await response.json();
        const collaboratorUser = users.find(user => user.email.toLowerCase() === collaboratorEmail.toLowerCase());
        
        if (!collaboratorUser) {
            return res.status(404).json({ msg: 'User to share with not found.' });
        }
        
        if (collaboratorUser.id === ownerId) {
            return res.status(400).json({ msg: 'You cannot share a document with yourself.' });
        }

        const { error: shareError } = await supabase
            .from('document_collaborators')
            .insert({ document_id: documentId, user_id: collaboratorUser.id });
        
        if (shareError) {
            if (shareError.code === '23505') {
                return res.status(400).json({ msg: 'Document already shared with this user.' });
            }
            throw shareError;
        }

        res.json({ msg: 'Document shared successfully.' });
    } catch (err) {
        console.error("Error sharing document:", err);
        res.status(500).json({ error: "Failed to share document" });
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: No token provided'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_default_jwt_secret');
        socket.user = decoded.user;
        next();
    } catch (err) {
        next(new Error('Authentication error: Invalid token'));
    }
});

io.on("connection", (socket) => {
    console.log(`Authenticated user connected: ${socket.user.email} (${socket.id})`);

    socket.on("get-document", async (documentId) => {
        try {
            const { data, error } = await supabase.rpc('get_documents_for_user', {
                user_id_param: socket.user.id
            });

            if (error) throw error;

            const hasAccess = data.some(doc => doc.id === documentId);
            if (!hasAccess) {
                socket.emit('auth-error', { message: 'You do not have permission to access this document.' });
                return;
            }
            
            const { data: docContent, error: contentError } = await supabase
                .from('documents')
                .select('content, history')
                .eq('id', documentId)
                .single();
            
            if (contentError) throw contentError;

            socket.join(documentId);
            console.log(`Socket ${socket.id} joined room ${documentId}`);
            socket.emit("load-document", docContent);

        } catch (err) {
            console.error(`Error fetching document ${documentId}:`, err);
        }
    });

    socket.on("send-changes", (delta) => {
        socket.broadcast.to(delta.documentId).emit("receive-changes", delta.content);
    });

    socket.on("save-document", async ({ documentId, content }) => {
        try {
            const { data: currentDoc, error: fetchError } = await supabase
                .from('documents').select('history').eq('id', documentId).single();

            if (fetchError) throw fetchError;
            let history = currentDoc.history || [];
            history.unshift(content);
            if (history.length > 20) history = history.slice(0, 20);

            await supabase
                .from('documents')
                .update({ content: content, history: history, updated_at: new Date().toISOString() })
                .eq('id', documentId);
            
            io.in(documentId).emit("document-saved", { history });
        } catch (err) {
            console.error(`Error saving document ${documentId}:`, err);
        }
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});

module.exports = server;
