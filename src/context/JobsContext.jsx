import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getMyJobs, createJob, updateJob, deleteJob as deleteJobApi,
  searchJobs, applyToJob as applyToJobApi, getMyApplications,
} from '../services/api';

const JobsContext = createContext();

export const useJobs = () => {
  return useContext(JobsContext);
};

/* ══════════════════════════════════════════════════
   JobsProvider — company-side job postings, backed by
   the real /api/jobs endpoints. Keeps a local mirror of
   draft/published jobs so pages don't all have to
   re-fetch, but every write (save/publish/delete) goes
   straight to the backend first and only updates local
   state once that succeeds.

   Also carries the candidate-side browse/search/apply
   state (browseJobs, myApplications) so JobsPage and the
   apply modal share one source of truth instead of each
   re-fetching independently.
══════════════════════════════════════════════════ */
export const JobsProvider = ({ children }) => {
  const { user } = useAuth();
  const [draftJobs, setDraftJobs] = useState([]);
  const [publishedJobs, setPublishedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Candidate-side
  const [browseJobs, setBrowseJobs] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState('');
  const [myApplications, setMyApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    if (!user || user.role !== 'company') return;
    setLoading(true);
    setError('');
    try {
      const jobs = await getMyJobs();
      setDraftJobs(jobs.filter((j) => j.status === 'draft'));
      setPublishedJobs(jobs.filter((j) => j.status !== 'draft'));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your job postings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Persists a job as a draft. Creates it if it has no id yet, otherwise
  // updates the existing one. Never throws away partial data — the
  // backend accepts incomplete drafts. `files` is the optional
  // { jobDescriptionPdf, companyBrochurePdf } attachment map.
  const saveDraft = async (jobData, files = {}) => {
    const payload = { ...jobData, status: 'draft' };
    const job = jobData.id
      ? await updateJob(jobData.id, payload, files)
      : await createJob(payload, files);

    setDraftJobs((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [job, ...prev];
    });
    return job;
  };

  // Publishes a job. The backend validates the listing is complete
  // before flipping it to 'active' and will throw if it isn't.
  const publishJob = async (jobData, files = {}) => {
    const payload = { ...jobData, status: 'active' };
    const job = jobData.id
      ? await updateJob(jobData.id, payload, files)
      : await createJob(payload, files);

    setDraftJobs((prev) => prev.filter((j) => j.id !== job.id));
    setPublishedJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
    return job;
  };

  const deleteDraft = async (id) => {
    await deleteJobApi(id);
    setDraftJobs((prev) => prev.filter((j) => j.id !== id));
  };

  /* ── Candidate: search/browse every active listing ── */
  const searchOpenJobs = useCallback(async (filters = {}) => {
    if (!user || user.role !== 'candidate') return [];
    setBrowseLoading(true);
    setBrowseError('');
    try {
      const jobs = await searchJobs(filters);
      setBrowseJobs(jobs);
      return jobs;
    } catch (err) {
      setBrowseError(err.response?.data?.message || 'Could not load jobs.');
      return [];
    } finally {
      setBrowseLoading(false);
    }
  }, [user]);

  /* ── Candidate: my submitted applications ── */
  const fetchMyApplications = useCallback(async () => {
    if (!user || user.role !== 'candidate') return;
    setApplicationsLoading(true);
    try {
      const jobs = await getMyApplications();
      setMyApplications(jobs);
    } catch {
      /* leave whatever was there before */
    } finally {
      setApplicationsLoading(false);
    }
  }, [user]);

  /* ── Candidate: submit an application ──
     Updates browseJobs/myApplications in place so the card flips to
     "Applied" immediately without a full re-fetch. */
  const applyToJob = async (jobId, payload, resumeFile = null) => {
    const job = await applyToJobApi(jobId, payload, resumeFile);
    setBrowseJobs((prev) => prev.map((j) => (j.id === job.id ? job : j)));
    setMyApplications((prev) => {
      const exists = prev.some((j) => j.id === job.id);
      return exists ? prev.map((j) => (j.id === job.id ? job : j)) : [job, ...prev];
    });
    return job;
  };

  return (
    <JobsContext.Provider
      value={{
        draftJobs, publishedJobs, loading, error, fetchJobs, saveDraft, publishJob, deleteDraft,
        browseJobs, browseLoading, browseError, searchOpenJobs,
        myApplications, applicationsLoading, fetchMyApplications,
        applyToJob,
      }}
    >
      {children}
    </JobsContext.Provider>
  );
};