import React from 'react';
import { MessageSquare, Upload, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import { useChatStore } from '@/stores/chat';

const App: React.FC = () => {
  const { clearMessages } = useChatStore();

  const handleUploadComplete = (response: any) => {
    console.log('Upload completed:', response);
    // You could show a toast notification here
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              RAGdoll
            </h1>
            <p className="text-muted-foreground">
              Upload documents and chat with an AI assistant that uses your documents as context
            </p>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Document Upload */}
            <div className="lg:col-span-1 space-y-6">
              <DocumentUpload onUploadComplete={handleUploadComplete} />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => clearMessages()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Chat
                  </Button>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How to Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Upload className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">1. Upload Documents</p>
                      <p className="text-muted-foreground">
                        Upload PDF, DOCX, or TXT files to build your knowledge base
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">2. Ask Questions</p>
                      <p className="text-muted-foreground">
                        Chat with the AI assistant about your documents
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">3. View Sources</p>
                      <p className="text-muted-foreground">
                        See which documents the AI used to answer your questions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Chat Interface */}
            <div className="lg:col-span-2">
              <ChatInterface />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
