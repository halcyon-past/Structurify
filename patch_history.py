import re

with open("frontend/src/app/history/page.tsx", "r") as f:
    content = f.read()

# Update JobCard signature
content = content.replace(
    "function JobCard({ job }: { job: HistoryJob }) {",
    "function JobCard({ job, onCancel }: { job: HistoryJob, onCancel: (id: string) => void }) {"
)

# Insert the cancel button inside JobCard
cancel_btn = """          {(job.status === "queued" || job.status === "processing" || job.status === "processing_chunks") && (
            <button
              onClick={(e) => { e.stopPropagation(); onCancel(job.job_id); }}
              className="text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 px-3 py-1.5 rounded-lg transition-all"
            >
              Cancel
            </button>
          )}
          <ChevronDown"""
content = content.replace("<ChevronDown", cancel_btn)

# Update HistoryPage usage
content = content.replace(
    "const { jobs, loading: jobsLoading } = useUserHistory(user?.uid);",
    "const { jobs, loading: jobsLoading, cancelJob } = useUserHistory(user?.uid);"
)

content = content.replace(
    "<JobCard key={job.job_id} job={job} />",
    "<JobCard key={job.job_id} job={job} onCancel={cancelJob} />"
)

with open("frontend/src/app/history/page.tsx", "w") as f:
    f.write(content)
