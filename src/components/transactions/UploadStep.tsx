"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANK_FORMATS } from "@/lib/constants/bank-formats";
import { createClient } from "@/lib/supabase/client";
import { createStatementRecord } from "@/app/actions/transactions";
import { toast } from "sonner";
import { Upload, Loader2, FileUp } from "lucide-react";
import type { BankFormatId } from "@/lib/constants/bank-formats";

interface UploadStepProps {
  onUploadComplete: (
    statementId: string,
    bankFormatId: BankFormatId,
    file: File
  ) => void;
  isProcessing: boolean;
  progressMessage: string;
}

export function UploadStep({
  onUploadComplete,
  isProcessing,
  progressMessage,
}: UploadStepProps) {
  const [bankFormatId, setBankFormatId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedFormat = BANK_FORMATS.find((f) => f.id === bankFormatId);
  const acceptTypes =
    selectedFormat?.statementType === "pdf" ? ".pdf" : ".csv";

  const handleUpload = async () => {
    if (!bankFormatId || !file) {
      toast.error("Select a bank format and file");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();
      const year = new Date().getFullYear();
      const storagePath = `${bankFormatId}/${year}/${file.name}`;

      // Upload file to Supabase storage
      const { error: uploadErr } = await supabase.storage
        .from("statements")
        .upload(storagePath, file, { upsert: false });

      if (uploadErr) {
        // If file already exists, add timestamp
        if (uploadErr.message?.includes("already exists")) {
          const ts = Date.now();
          const ext = file.name.split(".").pop();
          const baseName = file.name.replace(`.${ext}`, "");
          const uniquePath = `${bankFormatId}/${year}/${baseName}_${ts}.${ext}`;

          const { error: retryErr } = await supabase.storage
            .from("statements")
            .upload(uniquePath, file, { upsert: false });

          if (retryErr) throw retryErr;

          const result = await createStatementRecord(
            bankFormatId,
            file.name,
            uniquePath,
            null
          );

          if (!result.success || !result.statementId) {
            throw new Error(result.error || "Failed to create statement record");
          }

          onUploadComplete(
            result.statementId,
            bankFormatId as BankFormatId,
            file
          );
          return;
        }
        throw uploadErr;
      }

      // Create statement DB record
      const result = await createStatementRecord(
        bankFormatId,
        file.name,
        storagePath,
        null
      );

      if (!result.success || !result.statementId) {
        throw new Error(result.error || "Failed to create statement record");
      }

      onUploadComplete(
        result.statementId,
        bankFormatId as BankFormatId,
        file
      );
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const busy = isUploading || isProcessing;

  return (
    <div className="space-y-6 py-2">
      <div>
        <label className="text-sm font-medium mb-1 block">Bank Format</label>
        <Select
          value={bankFormatId}
          onValueChange={(v) => {
            if (v) {
              setBankFormatId(v);
              setFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
          }}
          disabled={busy}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select bank format..." />
          </SelectTrigger>
          <SelectContent>
            {BANK_FORMATS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Statement File</label>
        <div className="flex items-center gap-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept={bankFormatId ? acceptTypes : ".pdf,.csv"}
            disabled={!bankFormatId || busy}
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
          />
        </div>
        {file && (
          <p className="text-xs text-muted-foreground mt-1">
            <FileUp className="inline h-3 w-3 mr-1" />
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
      </div>

      {progressMessage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {!progressMessage.startsWith("Error") && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span
            className={
              progressMessage.startsWith("Error") ? "text-destructive" : ""
            }
          >
            {progressMessage}
          </span>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={!bankFormatId || !file || busy}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              {isUploading ? "Uploading..." : "Processing..."}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-1" />
              Upload & Parse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
