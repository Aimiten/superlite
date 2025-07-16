import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface CommentFormProps {
  shareId: string;
  onCommentSubmit: (comment: string, replyToId?: string | null) => Promise<void>;
  replyToId?: string | null;
  onCancelReply?: () => void;
  placeholder?: string;
  buttonText?: string;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  shareId,
  onCommentSubmit,
  replyToId = null,
  onCancelReply,
  placeholder = "Kirjoita kommentti tai kysymys tähän...",
  buttonText = "Lähetä kommentti",
  isReply = false
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onCommentSubmit(comment, replyToId);
      setComment("");
      if (onCancelReply && replyToId) {
        onCancelReply();
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`space-y-3 ${isReply ? "ml-8 border-l-2 pl-4 pt-2" : ""}`}>
      {isReply && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Vastaa kommenttiin</span>
          {onCancelReply && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onCancelReply}
              className="h-7 px-2"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Peruuta</span>
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-24 resize-none"
        />

        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {!user && "Kommentointi kirjautumattomana."}
            {user && `Kommentointi käyttäjänä: ${user.email}`}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;