//components/admin/FeaturedImagePicker:

import { ChangeEvent, useId, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeaturedImagePickerProps {
  url: string;
  onUrlChange: (url: string) => void;
}

export default function FeaturedImagePicker({
  url,
  onUrlChange,
}: FeaturedImagePickerProps) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        onUrlChange(result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Featured Image (URL or Upload)</Label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 flex items-center gap-2">
          <Input
            id={inputId}
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/cover.jpg or data URL"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload an image file</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onUrlChange("")}
                >
                  <X className="h-4 w-4 mr-2" /> Clear
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove selected image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {url && (
        <div className="border rounded-md p-2 flex items-center gap-3 shadow-sm bg-muted">
          <ImageIcon className="h-5 w-5" />
          <Image
            src={url}
            alt="Featured preview"
            width={512}
            height={128}
            className="max-h-32 rounded-md shadow-md object-cover"
          />
        </div>
      )}
    </div>
  );
}
