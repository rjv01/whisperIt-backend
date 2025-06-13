
const buildCommentTree = (comments, parentId = null) => {
  return comments
    .filter(comment => String(comment.parent) === String(parentId))
    .map(comment => ({
      ...comment,
      replies: buildCommentTree(comments, comment._id)
    }));
};

module.exports = { buildCommentTree };
