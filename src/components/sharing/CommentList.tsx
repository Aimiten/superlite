import React, { useState } from "react";
import CommentItem, { Comment } from "./CommentItem";
import CommentForm from "./CommentForm";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentsListProps {
  comments: Comment[];
  shareId: string;
  onCommentSubmit: (comment: string, replyToId?: string | null) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  maxHeight?: string;
  isAdmin?: boolean;
}

const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  shareId,
  onCommentSubmit,
  isLoading = false,
  error = null,
  maxHeight = "400px",
  isAdmin = false
}) => {
  const [replyToId, setReplyToId] = useState<string | null>(null);

  // Organisoi kommentit hierarkkisesti (pääkommentit ja vastaukset)
  const organizedComments = React.useMemo(() => {
    const mainComments: Comment[] = [];
    const replies: Record<string, Comment[]> = {};

    // Järjestä kaikki kommentit ajallisesti
    const sortedComments = [...comments].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Järjestä kommentit päätason kommentteihin ja vastauksiin
    sortedComments.forEach(comment => {
      if (comment.is_reply_to) {
        if (!replies[comment.is_reply_to]) {
          replies[comment.is_reply_to] = [];
        }
        replies[comment.is_reply_to].push(comment);
      } else {
        mainComments.push(comment);
      }
    });

    return { mainComments, replies };
  }, [comments]);

  const { mainComments, replies } = organizedComments;

  // Tyhjätila kun ei kommentteja
  if (!isLoading && !error && comments.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Ei kommentteja</h3>
        <p className="text-muted-foreground mb-6">Tähän jakoon ei ole vielä jätetty kommentteja.</p>

        <div className="mt-6">
          <h4 className="text-base font-medium mb-3">Lisää ensimmäinen kommentti</h4>
          <CommentForm 
            shareId={shareId} 
            onCommentSubmit={onCommentSubmit} 
          />
        </div>
      </div>
    );
  }

  // Virhetila
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Virhe</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <CommentForm 
          shareId={shareId} 
          onCommentSubmit={onCommentSubmit} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ScrollArea className={`max-h-[${maxHeight}]`}>
        <div className="space-y-4">
          {mainComments.map(comment => (
            <div key={comment.id} className="space-y-3">
              {/* Päätason kommentti */}
              <CommentItem 
                comment={comment} 
                onReplyClick={() => setReplyToId(comment.id)}
                isAdmin={isAdmin}
              />

              {/* Kommenttiin liittyvät vastaukset */}
              {replies[comment.id]?.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  isReply={true}
                  isAdmin={isAdmin}
                />
              ))}

              {/* Vastauslomake jos vastataan tähän kommenttiin */}
              {replyToId === comment.id && (
                <CommentForm 
                  shareId={shareId} 
                  onCommentSubmit={onCommentSubmit}
                  replyToId={comment.id}
                  onCancelReply={() => setReplyToId(null)}
                  placeholder="Kirjoita vastaus..."
                  buttonText="Vastaa"
                  isReply={true}
                />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Uuden pääkommentin lisääminen */}
      <div className="pt-4 border-t">
        <h4 className="text-base font-medium mb-3">Lisää kommentti</h4>
        <CommentForm 
          shareId={shareId} 
          onCommentSubmit={onCommentSubmit} 
        />
      </div>
    </div>
  );
};

export default CommentsList;