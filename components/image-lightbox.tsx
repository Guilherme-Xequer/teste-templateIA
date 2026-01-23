"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageLightbox({
  src,
  alt,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-0 bg-transparent">
        <VisuallyHidden>
          <DialogTitle>{alt}</DialogTitle>
        </VisuallyHidden>
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={800}
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
          priority
        />
      </DialogContent>
    </Dialog>
  );
}
