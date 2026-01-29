//============ GLOBAL VARIABLES ============
let allPosts = [];
let allComments = [];
let maxPostId = 0;
let maxCommentId = 0;
let editingPostId = null;

const API_URL = 'http://localhost:3000';

//============ LOAD DATA ============
async function Load() {
    try {
        // Load posts
        let postRes = await fetch(`${API_URL}/posts`);
        allPosts = await postRes.json();
        
        // Load comments
        let commentRes = await fetch(`${API_URL}/comments`);
        allComments = await commentRes.json();
        
        // Initialize isDeleted field if not exists
        allPosts = allPosts.map(post => ({
            ...post,
            isDeleted: post.isDeleted || false
        }));
        
        // Calculate max IDs
        maxPostId = Math.max(...allPosts.map(p => {
            const num = typeof p.id === 'string' ? parseInt(p.id) : p.id;
            return isNaN(num) ? 0 : num;
        }), 0);
        
        maxCommentId = Math.max(...allComments.map(c => {
            const num = typeof c.id === 'string' ? parseInt(c.id) : c.id;
            return isNaN(num) ? 0 : num;
        }), 0);
        
        RenderTable();
    } catch (error) {
        console.error("Error loading data:", error);
    }
}

//============ RENDER TABLE ============
async function RenderTable() {
    let body = document.getElementById("table-body");
    body.innerHTML = "";
    
    for (const post of allPosts) {
        const isDeleted = post.isDeleted;
        const textDecoration = isDeleted ? "text-decoration: line-through; opacity: 0.6;" : "";
        const deletedBadge = isDeleted ? ' <span class="deleted-badge">🗑️ Đã xóa</span>' : '';
        const commentCount = allComments.filter(c => c.postId === post.id && !c.isDeleted).length;
        
        body.innerHTML += `
            <tr style="${textDecoration}">
                <td>${post.id}</td>
                <td>${post.title}${deletedBadge}</td>
                <td>👁️ ${post.views || 0}</td>
                <td>
                    <button class="btn btn-comments" onclick="OpenCommentsModal('${post.id}', '${post.title}')">
                        💬 ${commentCount}
                    </button>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-edit" onclick="Edit('${post.id}')">✏️ Sửa</button>
                    <button class="btn ${isDeleted ? 'btn-restore' : 'btn-delete'}" 
                        onclick="Delete('${post.id}')">
                        ${isDeleted ? '↩️ Khôi phục' : '🗑️ Xóa'}
                    </button>
                </td>
            </tr>
        `;
    }
}

//============ EDIT POST ============
function Edit(id) {
    const post = allPosts.find(p => p.id === id);
    if (post) {
        editingPostId = id;
        document.getElementById("id_txt").value = id;
        document.getElementById("id_txt").disabled = true;
        document.getElementById("title_txt").value = post.title;
        document.getElementById("views_txt").value = post.views || 0;
        document.getElementById("save-btn").textContent = "✏️ Cập Nhật";
    }
}

//============ ADD NEW POST ============
function AddNew() {
    editingPostId = null;
    document.getElementById("id_txt").value = "";
    document.getElementById("id_txt").disabled = false;
    document.getElementById("title_txt").value = "";
    document.getElementById("views_txt").value = "";
    document.getElementById("save-btn").textContent = "➕ Thêm Mới";
    document.getElementById("title_txt").focus();
}

//============ SAVE POST ============
async function Save() {
    let id = document.getElementById("id_txt").value.trim();
    let title = document.getElementById("title_txt").value.trim();
    let views = document.getElementById("views_txt").value;
    
    if (!title) {
        alert("Vui lòng nhập tiêu đề!");
        return;
    }
    
    let res;
    
    if (editingPostId) {
        // Update existing post
        const post = allPosts.find(p => p.id === editingPostId);
        if (post) {
            post.title = title;
            post.views = parseInt(views) || 0;
            
            res = await fetch(`${API_URL}/posts/${editingPostId}`, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(post)
            });
        }
    } else {
        // Add new post
        const newId = String(maxPostId + 1);
        maxPostId++;
        
        res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id: newId,
                title: title,
                views: parseInt(views) || 0,
                isDeleted: false
            })
        });
    }
    
    if (res.ok) {
        Load();
        AddNew();
    }
}

//============ SOFT DELETE POST ============
async function Delete(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    
    if (post.isDeleted) {
        if (!confirm("Khôi phục bài viết này?")) return;
        post.isDeleted = false;
    } else {
        if (!confirm("Xóa bài viết này? (Xóa mềm - có thể khôi phục)")) return;
        post.isDeleted = true;
    }
    
    let res = await fetch(`${API_URL}/posts/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(post)
    });
    
    if (res.ok) {
        Load();
    }
}

//============ COMMENTS MANAGEMENT ============
async function OpenCommentsModal(postId, postTitle) {
    document.getElementById("commentsModal").style.display = "block";
    document.getElementById("modal-title").textContent = `💬 Bình Luận - ${postTitle}`;
    document.getElementById("current-post-id").value = postId;
    document.getElementById("comment-input").value = "";
    RenderComments(postId);
    document.getElementById("comment-input").focus();
}

function CloseCommentsModal() {
    document.getElementById("commentsModal").style.display = "none";
}

async function RenderComments(postId) {
    const commentsList = document.getElementById("comments-list");
    const comments = allComments.filter(c => c.postId === postId);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">Chưa có bình luận nào</p>';
        return;
    }
    
    let html = '';
    for (const comment of comments) {
        const isDeleted = comment.isDeleted;
        const textDecoration = isDeleted ? "text-decoration: line-through; opacity: 0.6;" : "";
        const deletedBadge = isDeleted ? '<span class="deleted-badge">🗑️</span>' : '';
        
        html += `
            <div class="comment-item" style="${textDecoration}">
                <div class="comment-header">
                    <strong>ID: ${comment.id}</strong> ${deletedBadge}
                </div>
                <p class="comment-text">${comment.text}</p>
                <div class="comment-actions">
                    <button class="btn btn-sm btn-edit" onclick="EditComment('${comment.id}', '${postId}')">✏️ Sửa</button>
                    <button class="btn btn-sm ${isDeleted ? 'btn-restore' : 'btn-delete'}" 
                        onclick="DeleteComment('${comment.id}', '${postId}')">
                        ${isDeleted ? '↩️ Khôi phục' : '🗑️ Xóa'}
                    </button>
                </div>
            </div>
        `;
    }
    
    commentsList.innerHTML = html;
}

async function AddComment() {
    const postId = document.getElementById("current-post-id").value;
    const text = document.getElementById("comment-input").value.trim();
    
    if (!text) {
        alert("Vui lòng nhập nội dung bình luận!");
        return;
    }
    
    const newCommentId = String(maxCommentId + 1);
    maxCommentId++;
    
    const res = await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: newCommentId,
            postId: postId,
            text: text,
            isDeleted: false
        })
    });
    
    if (res.ok) {
        document.getElementById("comment-input").value = "";
        const comment = await res.json();
        allComments.push(comment);
        RenderComments(postId);
    }
}

async function EditComment(commentId, postId) {
    const comment = allComments.find(c => c.id === commentId);
    if (!comment) return;
    
    const newText = prompt("Chỉnh sửa bình luận:", comment.text);
    if (!newText || !newText.trim()) return;
    
    comment.text = newText.trim();
    
    const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(comment)
    });
    
    if (res.ok) {
        RenderComments(postId);
    }
}

async function DeleteComment(commentId, postId) {
    const comment = allComments.find(c => c.id === commentId);
    if (!comment) return;
    
    if (comment.isDeleted) {
        if (!confirm("Khôi phục bình luận này?")) return;
        comment.isDeleted = false;
    } else {
        if (!confirm("Xóa bình luận này?")) return;
        comment.isDeleted = true;
    }
    
    const res = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(comment)
    });
    
    if (res.ok) {
        RenderComments(postId);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById("commentsModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

//============ INITIALIZE ============
Load();