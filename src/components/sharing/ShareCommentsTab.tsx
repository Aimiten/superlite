import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "./CommentItem";
import CommentsList from "./CommentList";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, MessageSquare } from "lucide-react";

interface ShareCommentsTabProps {
  shareId: string;
  shareName?: string;
}

const ShareCommentsTab: React.FC<ShareCommentsTabProps> = ({ 
  shareId, 
  shareName = "Jakaminen"
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hae kommentit
  const fetchComments = async () => {
    if (!shareId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('share_comments')
        .select('*, profiles(full_name, email)')
        .eq('share_id', shareId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Muokkaa data sisältämään myös käyttäjänimet
      const formattedComments: Comment[] = (data || []).map(comment => ({
        ...comment,
        user_name: comment.profiles?.full_name || null,
        user_email: comment.profiles?.email || null,
        is_owner: user?.id === comment.user_id
      }));

      setComments(formattedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Kommenttien hakeminen epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  // Kommenttien lähetys
  const handleCommentSubmit = async (content: string, replyToId: string | null = null) => {
    if (!shareId || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('share_comments')
        .insert({
          share_id: shareId,
          user_id: user?.id || null,
          content: content.trim(),
          is_reply_to: replyToId
        })
        .select()
        .single();

      if (error) throw error;

      // Lisää uusi kommentti listaan
      const newComment: Comment = {
        ...data,
        user_name: user?.user_metadata?.full_name || null,
        user_email: user?.email || null,
        is_owner: !!user?.id
      };

      setComments(prev => [...prev, newComment]);

      toast({
        title: "Kommentti lähetetty",
        description: replyToId ? "Vastauksesi on tallennettu." : "Kommenttisi on tallennettu.",
      });
    } catch (err) {
      console.error('Error submitting comment:', err);
      toast({
        title: "Virhe",
        description: "Kommentin lähettäminen epäonnistui.",
        variant: "destructive",
      });
      throw err; // Annetaan virhe eteenpäin CommentForm-komponentille
    }
  };

  // Hae kommentit sivun latautuessa
  useEffect(() => {
    if (shareId) {
      fetchComments();
    }
  }, [shareId]);

  // Käyttöliittymä latauksen aikana
  if (loading && comments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kommentit</CardTitle>
          <CardDescription>Jaon kommentit ja kysymykset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Kommentit {comments.length > 0 && `(${comments.length})`}
        </CardTitle>
        <CardDescription>
          {shareName} - Kommentit ja kysymykset
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CommentsList
          comments={comments}
          shareId={shareId}
          onCommentSubmit={handleCommentSubmit}
          isLoading={loading && comments.length === 0}
          error={error}
          isAdmin={true}
        />
      </CardContent>
    </Card>
  );
};

export default ShareCommentsTab;