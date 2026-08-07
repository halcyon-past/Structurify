import { CheckCircle, AlertCircle, Loader2, Download } from "lucide-react";
import { JobState } from "@/hooks/useJobListener";

interface JobStatusProps {
  jobId: string;
  jobState: JobState | null;
}

export function JobStatus({ jobId, jobState }: JobStatusProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-bold mb-4">Job Status Pipeline</h2>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${jobState?.status === 'failed' ? 'bg-red-100 text-red-600' : jobState?.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {jobState?.status === 'completed' ? <CheckCircle size={24} data-testid="status-completed" /> : 
             jobState?.status === 'failed' ? <AlertCircle size={24} data-testid="status-failed" /> : 
             <Loader2 size={24} className="animate-spin" data-testid="status-loading" />}
          </div>
          <div>
            <p className="font-bold text-gray-900 capitalize" data-testid="status-text">{jobState?.status || 'Queued'}</p>
            <p className="text-sm text-gray-500 text-xs font-mono">ID: {jobId}</p>
          </div>
        </div>

        {jobState?.status === 'completed' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Processed Rows</p>
                <p className="font-bold text-lg">{jobState.processed_rows}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Processing Time</p>
                <p className="font-bold text-lg">{jobState.duration_seconds}s</p>
              </div>
            </div>
            {jobState.download_url && (
              <a 
                href={jobState.download_url} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                <Download size={20} />
                Download Clean XLSX
              </a>
            )}
          </div>
        )}

        {jobState?.status === 'failed' && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 text-sm overflow-auto">
            <p className="font-semibold mb-1">Error:</p>
            <p>{jobState.error_message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
