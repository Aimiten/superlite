import React, { useState } from "react";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { MessageSquare, User, Reply, CornerDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import DOMPurify from "dompurify";

export interface Comment {
  id: string;
  share_id: string;
  user_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_reply_to?: string | null;
  user_name?: string;
  user_email?: string;
  is_owner?: boolean;
}

interface CommentItemProps {
  comment: Comment;
  onReplyClick?: (commentId: string) => void;
  isReply?: boolean;
  isAdmin?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  onReplyClick,
  isReply = false,
  isAdmin = false
}) => {
  // Lyhenne nimestä avataria varten
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Käyttäjän nimi tai "Vieras" jos ei käyttäjää
  const userName = comment.user_name || (comment.user_id ? "Käyttäjä" : "Vieras");

  return (
    <div className={`p-4 ${isReply ? "ml-8 border-l-2 border-border pl-4" : "border border-border rounded-lg"} 
                     ${comment.is_owner ? "bg-info/5" : isReply ? "bg-muted" : "bg-background"}`}>
      <div className="flex items-start gap-3">
        <Avatar className={`h-8 w-8 ${comment.is_owner ? "bg-info" : "bg-muted-foreground"}`}>
          <AvatarFallback>{getInitials(userName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {userName}
            </span>

            {comment.is_owner && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 bg-info/10 text-info">
                Jaon omistaja
              </Badge>
            )}

            <span className="text-muted-foreground text-xs">
              {format(new Date(comment.created_at), "d.M.yyyy HH:mm", { locale: fi })}
            </span>
          </div>

          <div className="text-sm whitespace-pre-line">
            {isReply && (
              <div className="flex items-center text-xs text-muted-foreground mb-1">
                <CornerDownRight className="h-3 w-3 mr-1" />
                <span>Vastaus</span>
              </div>
            )}
            <div 
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(comment.content, {
                  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
                  ALLOWED_ATTR: ['href', 'target', 'rel']
                })
              }}
            />
          </div>

          {onReplyClick && !isReply && (
            <div className="pt-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onReplyClick(comment.id)}
              >
                <Reply className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs">Vastaa</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;