import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { z } from "zod";

const uploadSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().max(1000).optional(),
  documentType: z.enum(["Gazette", "Extraordinary Gazette", "Act", "Bill", "Form", "Notice"]),
  category: z.string().min(1, "Category is required"),
  accessLevel: z.enum(["free", "pro", "enterprise"]),
  file: z.instanceof(File).refine((file) => file.type === "application/pdf", "Only PDF files are allowed"),
});

export function DocumentUploadForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    documentType: "",
    category: "",
    accessLevel: "pro",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    try {
      setUploading(true);

      // Validate form data
      const validated = uploadSchema.parse({
        ...formData,
        file: selectedFile,
      });

      // Get partner profile
      const { data: profile, error: profileError } = await supabase
        .from("partner_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Partner profile not found. Please complete your application first.");
      }

      // Upload file to Supabase Storage
      const fileExt = "pdf";
      const fileName = `${Date.now()}-${validated.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("partner-documents")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("partner-documents")
        .getPublicUrl(filePath);

      // Insert document record
      const { error: insertError } = await supabase
        .from("partner_documents")
        .insert({
          partner_id: profile.id,
          title: validated.title,
          description: validated.description || "",
          document_type: validated.documentType,
          category: validated.category,
          access_level: validated.accessLevel,
          file_url: publicUrl,
          file_type: "application/pdf",
          file_size: selectedFile.size,
          status: "pending",
        });

      if (insertError) throw insertError;

      toast({
        title: "Document uploaded successfully!",
        description: "Your document is pending admin review",
      });

      // Reset form
      setFormData({
        title: "",
        description: "",
        documentType: "",
        category: "",
        accessLevel: "pro",
      });
      setSelectedFile(null);
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Upload legal documents to share with the community. All uploads are reviewed before publishing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Document Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter document title"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the document content"
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                required
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gazette">Gazette</SelectItem>
                  <SelectItem value="Extraordinary Gazette">Extraordinary Gazette</SelectItem>
                  <SelectItem value="Act">Act</SelectItem>
                  <SelectItem value="Bill">Bill</SelectItem>
                  <SelectItem value="Form">Form</SelectItem>
                  <SelectItem value="Notice">Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Corporate, Tax, Labor"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessLevel">Access Level *</Label>
            <Select
              value={formData.accessLevel}
              onValueChange={(value) => setFormData({ ...formData, accessLevel: value })}
              required
            >
              <SelectTrigger id="accessLevel">
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free - Available to all users</SelectItem>
                <SelectItem value="pro">Pro - Requires Pro subscription</SelectItem>
                <SelectItem value="enterprise">Enterprise - Enterprise only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">PDF Document *</Label>
            <div className="flex items-center gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                required
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDF files only. Maximum file size: 50MB
            </p>
          </div>

          <Button type="submit" disabled={uploading || !selectedFile} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
