"use client";

import React, { useRef, useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2,
  Quote,
  Code,
  Eye,
  Edit3,
  Loader2
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  onImageUpload, 
  placeholder, 
  className 
}: MarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Set focus back and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      setIsUploading(true);
      try {
        const url = await onImageUpload(file);
        insertText(`![${file.name}](${url})`);
      } catch (error) {
        console.error("Image upload failed:", error);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    }
  };

  const toolbarItems = [
    { icon: <Heading1 size={18} />, label: "H1", action: () => insertText("# ", "") },
    { icon: <Heading2 size={18} />, label: "H2", action: () => insertText("## ", "") },
    { icon: <Bold size={18} />, label: "Bold", action: () => insertText("**", "**") },
    { icon: <Italic size={18} />, label: "Italic", action: () => insertText("_", "_") },
    { icon: <Quote size={18} />, label: "Quote", action: () => insertText("> ", "") },
    { icon: <Code size={18} />, label: "Code", action: () => insertText("`", "`") },
    { icon: <List size={18} />, label: "Bullet List", action: () => insertText("- ", "") },
    { icon: <ListOrdered size={18} />, label: "Numbered List", action: () => insertText("1. ", "") },
    { icon: <LinkIcon size={18} />, label: "Link", action: () => insertText("[", "](url)") },
    { 
      icon: isUploading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />, 
      label: "Image", 
      action: handleImageClick,
      disabled: !onImageUpload || isUploading
    },
  ];

  return (
    <div className={`flex flex-col border rounded-md overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-muted/30 border-b flex-wrap gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          {toolbarItems.map((item, idx) => (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={item.action}
              disabled={item.disabled || isPreview}
              title={item.label}
            >
              {item.icon}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center border-l pl-2 gap-1 ml-auto">
          <Button
            type="button"
            variant={!isPreview ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(false)}
            className="h-8 gap-2"
          >
            <Edit3 size={16} /> Edit
          </Button>
          <Button
            type="button"
            variant={isPreview ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(true)}
            className="h-8 gap-2"
          >
            <Eye size={16} /> Preview
          </Button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={onFileChange}
      />

      {/* Editor / Preview Area */}
      <div className="relative min-h-[400px]">
        {!isPreview ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[400px] border-0 focus-visible:ring-0 rounded-none font-mono text-sm leading-relaxed p-4 h-full"
          />
        ) : (
          <div className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[400px] bg-background overflow-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value || "_Nothing to preview_"}
            </ReactMarkdown>
          </div>
        )}
      </div>
      
      <div className="p-1 px-4 text-[10px] text-muted-foreground bg-muted/20 border-t flex justify-between">
        <span>Markdown is supported</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
