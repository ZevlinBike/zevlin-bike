"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTrendingTopicsAction, draftAction, unsplashAction, listProductsAction, publishAssistPostAction, expandAction, getPostByIdAction, updateAssistPostAction, getKeywordListAction, optimizeBodyAction } from "./actions";
import type { UnsplashPhoto } from "@/lib/media/unsplash";
import { Loader2, ImageIcon, Lightbulb, Rocket, ListChecks, Eye, EyeOff, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "@/markdown-styles.module.css";
import { motion } from "framer-motion";

type Product = { id: string; name: string; slug: string };

export default function BlogAssistPage() {
  const searchParams = useSearchParams();
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [draft, setDraft] = useState<{ title: string; outline: string; intro: string } | null>(null);
  const [body, setBody] = useState<string>("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [unsplashMissingKey, setUnsplashMissingKey] = useState(false);
  const [imageIdx, setImageIdx] = useState<number | null>(null);
  const [headerUrl, setHeaderUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [publishing, startPublish] = useTransition();
  const [savingDraft, startSaveDraft] = useTransition();
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  // SEO step state
  const [keywordList, setKeywordList] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Record<string, boolean>>({});
  const [includeRelatedLinks, setIncludeRelatedLinks] = useState(false);
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  // Loading existing post state (when ?from=...)
  const [loadingExisting, setLoadingExisting] = useState(false);
  // Applying SEO updates overlay
  const [applyingSeo, setApplyingSeo] = useState(false);

  // Wizard state
  const steps = [
    { key: 1, title: "Pick a Topic" },
    { key: 2, title: "Outline & Intro" },
    { key: 3, title: "Header Image" },
    { key: 4, title: "Full Body" },
    { key: 5, title: "Feature a Product" },
    { key: 6, title: "SEO Keywords & Links" },
    { key: 7, title: "Review & Publish" },
  ] as const;
  const [step, setStep] = useState<(typeof steps)[number]["key"]>(1);
  const [showPreview, setShowPreview] = useState(true);
  const PREVIEW_WIDTH = 380; // px, smooth animated width for desktop preview

  useEffect(() => {
    setLoadingTopics(true);
    getTrendingTopicsAction({ seed: Date.now() }).then((t) => {
      setTopics(t);
      setLoadingTopics(false);
    });
    listProductsAction().then(setProducts);
  }, []);

  // Prefill from existing post when ?from=ID is present
  useEffect(() => {
    const id = searchParams.get("from");
    if (!id) return;
    setLoadingExisting(true);
    (async () => {
      try {
        const post = await getPostByIdAction(id);
        if (!post) return;
        setEditingId(id);
        setDraft({ title: post.title || "", outline: "", intro: post.excerpt || "" });
        setBody(post.body || "");
        setHeaderUrl(post.image_url || null);
        setSelectedTopic("");
        setCustomTopic("");
        setImageIdx(null);
        setPhotos([]);
        setStep(4); // jump to body editing
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [searchParams]);

  // Load keywords list when entering SEO step
  useEffect(() => {
    if (step !== 6) return;
    if (keywordList.length > 0) return;
    setLoadingKeywords(true);
    getKeywordListAction()
      .then((list) => setKeywordList(list || []))
      .finally(() => setLoadingKeywords(false));
  }, [step, keywordList.length]);

  const refreshTopics = async () => {
    setLoadingTopics(true);
    try {
      const t = await getTrendingTopicsAction({ seed: Date.now(), exclude: topics });
      setTopics(t);
    } finally {
      setLoadingTopics(false);
    }
  };

  const doDraft = async (topic: string) => {
    setDrafting(true);
    try {
      const d = await draftAction(topic);
      setDraft(d);
      setSelectedTopic(topic);
      setPhotos([]);
      setImageIdx(null);
      setBody("");
      setHeaderUrl(null);
      setEditingId(null); // switching to new topic => create new post
    } finally {
      setDrafting(false);
    }
  };

  const searchPhotos = async () => {
    setLoadingPhotos(true);
    try {
      const res = await unsplashAction(selectedTopic || customTopic);
      setPhotos(res.photos || []);
      setUnsplashMissingKey(!!res.missingKey);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const selectedPhoto = imageIdx != null ? photos[imageIdx] : null;
  const selectedProduct = products.find((p) => p.id === productId) || null;

  const combinedMarkdown = useMemo(() => {
    const introMd = draft?.intro?.trim() || "";
    const bodyMd = body?.trim() || "";
    const combined = [introMd, bodyMd].filter(Boolean).join("\n\n");
    return combined;
  }, [draft?.intro, body]);

  const publish = () => {
    if (!draft) return;
    startPublish(async () => {
      if (editingId) {
        await updateAssistPostAction({
          id: editingId,
          title: draft.title,
          outline: draft.outline,
          intro: draft.intro,
          body: body || undefined,
          imageUrl: selectedPhoto?.regular || headerUrl || null,
          publish: true,
        });
      } else {
        await publishAssistPostAction({
          title: draft.title,
          outline: draft.outline,
          intro: draft.intro,
          body: body || undefined,
          imageUrl: selectedPhoto?.regular || headerUrl || null,
          imageCredit: selectedPhoto ? { name: selectedPhoto.creditName, link: selectedPhoto.creditLink } : null,
          product: selectedProduct || null,
          publish: true,
        });
      }
      // navigate back to admin blog list
      window.location.href = "/admin/blog";
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <div className="container mx-auto px-4 lg:px-6 pt-28 pb-12">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">BlogAssist</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Draft an SEO-friendly post with real data, fast.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
              className="hidden lg:inline-flex"
              role="switch"
              aria-checked={showPreview}
              aria-label={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="ml-2">{showPreview ? "Hide Preview" : "Show Preview"}</span>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/blog">Back to Blog</Link>
            </Button>
          </div>
        </div>

        {/* Stepper */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-busy={loadingExisting}>
          {steps.map((s, idx) => {
            const active = step === s.key;
            const done = s.key < step;
            return (
              <button
                key={s.key}
                onClick={() => setStep(s.key)}
                disabled={loadingExisting}
                className={`px-3 py-1.5 rounded-md border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : done
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800'
                      : 'bg-white text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-700'
                } ${loadingExisting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <span className="font-medium mr-2">{idx + 1}.</span>
                {s.title}
              </button>
            );
          })}
        </div>

        <motion.div
          className="mt-6 lg:flex lg:items-start lg:gap-6"
          layout
          transition={{ layout: { duration: 0.28, ease: "easeInOut" } }}
        >
          {/* Main column: wizard content */}
          <motion.div className="min-w-0 flex-1 space-y-6 transform-gpu" layout>
            {/* Step 1: Topic */}
            {step === 1 && (
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Pick a Topic</CardTitle>
                  <Button size="sm" variant="outline" onClick={refreshTopics} disabled={loadingTopics} className="gap-2">
                    {loadingTopics ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} Refresh
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingTopics ? (
                    <div className="text-sm text-gray-500">Loading topics…</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topics.map((t, i) => (
                        <Button key={i} size="sm" variant={selectedTopic === t ? "default" : "secondary"} onClick={() => doDraft(t)}>
                          {t}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input placeholder="Or enter custom topic…" value={customTopic} onChange={(e) => setCustomTopic(e.target.value)} />
                    <Button onClick={() => doDraft(customTopic)} disabled={!customTopic || drafting} className="gap-2">
                      {drafting && <Loader2 className="h-4 w-4 animate-spin" />} Draft
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Outline + Intro */}
            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Outline & Intro</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-1 space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input value={draft?.title || ""} onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))} placeholder="Post title" />
                    <Separator />
                    <Button
                      variant="default"
                      onClick={async () => {
                        if (!draft) return;
                        try {
                          setGeneratingContent(true);
                          const res = await expandAction({ topic: selectedTopic || customTopic, outline: draft.outline, intro: draft.intro });
                          setBody(res.body || "");
                        } finally {
                          setGeneratingContent(false);
                        }
                      }}
                      disabled={!draft || generatingContent}
                      className="gap-2 w-full"
                    >
                      {generatingContent && <Loader2 className="h-4 w-4 animate-spin" />} Generate Full Content
                    </Button>
                  </div>
                  <div className="lg:col-span-1">
                    <label className="text-sm font-medium">Outline (Markdown)</label>
                    <Textarea rows={10} value={draft?.outline || ""} onChange={(e) => setDraft((d) => (d ? { ...d, outline: e.target.value } : d))} />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="text-sm font-medium">Intro (Markdown)</label>
                    <Textarea rows={10} value={draft?.intro || ""} onChange={(e) => setDraft((d) => (d ? { ...d, intro: e.target.value } : d))} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Header Image */}
            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Header Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="secondary" onClick={searchPhotos} disabled={!draft || loadingPhotos} className="gap-2 w-full sm:w-auto">
                      {loadingPhotos && <Loader2 className="h-4 w-4 animate-spin" />} Search Header Images
                    </Button>
                    <div className="text-xs text-gray-500 self-center">Based on: {selectedTopic || customTopic || 'topic'}</div>
                  </div>
                  {!Array.isArray(photos) || photos.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      {unsplashMissingKey
                        ? 'No images: set UNSPLASH_ACCESS_KEY in your environment and redeploy.'
                        : 'No images loaded yet. Click "Search Header Images" above or try a broader topic.'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {photos.map((p, idx) => (
                        <button key={p.id} onClick={() => { setImageIdx(idx); setHeaderUrl(p.regular || p.thumb || null); }} className={`rounded overflow-hidden border ${imageIdx === idx ? 'ring-2 ring-blue-500' : 'border-black/10 dark:border-white/10'}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.thumb} alt={p.alt} className="w-full h-24 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 4: Full Body */}
            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Full Body</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[60vh]">
                  <Textarea
                    className="flex-1 min-h-0 resize-none"
                    placeholder="Click 'Generate Full Content' or write your own."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    aria-busy={generatingContent}
                  />
                  <div className="mt-2 text-xs text-gray-500">Markdown supported. Keep sections skimmable with H2/H3 subheadings.</div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Feature Product */}
            {step === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Rocket className="h-4 w-4" /> Feature a Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <select className="h-9 rounded-md border bg-white dark:bg-neutral-900 px-3" value={productId} onChange={(e) => setProductId(e.target.value)}>
                    <option value="">None</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* Step 6: SEO Keywords & Links */}
            {step === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> SEO Keywords & Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Pick relevant phrases to reinforce. Optionally insert a Related Reading list.
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={loadingKeywords || applyingSeo || keywordList.length === 0}
                      onClick={() => {
                        const text = (body || "").toLowerCase();
                        const scored = keywordList.map((k) => ({
                          k,
                          c: (text.match(new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, 'gi')) || []).length,
                        })).sort((a, b) => a.c - b.c);
                        const next: Record<string, boolean> = {};
                        scored.slice(0, 6).forEach(({ k }) => (next[k] = true));
                        setSelectedKeywords(next);
                      }}
                    >
                      Auto-select Suggestions
                    </Button>
                    <label className="ml-2 inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={includeRelatedLinks} onChange={(e) => setIncludeRelatedLinks(e.target.checked)} disabled={applyingSeo} />
                      Insert &quot;Related Reading&quot; in body
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {(keywordList || []).slice(0, 60).map((kw) => (
                      <label key={kw} className="flex items-center gap-2 text-sm p-2 border rounded-md bg-white dark:bg-neutral-900">
                        <input
                          type="checkbox"
                          checked={!!selectedKeywords[kw]}
                          onChange={(e) => setSelectedKeywords((prev) => ({ ...prev, [kw]: e.target.checked }))}
                          disabled={applyingSeo}
                        />
                        <span className="truncate" title={kw}>{kw}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={async () => {
                        try {
                          setApplyingSeo(true);
                          const chosen = Object.keys(selectedKeywords).filter((k) => selectedKeywords[k]);
                          const res = await optimizeBodyAction({ body, selectedKeywords: chosen, includeRelatedLinks });
                          setBody(res.body || body);
                        } finally {
                          setApplyingSeo(false);
                        }
                      }}
                      disabled={loadingKeywords || applyingSeo}
                      className="gap-2"
                    >
                      {applyingSeo && <Loader2 className="h-4 w-4 animate-spin" />}
                      Apply SEO Updates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 7: Review & Publish */}
            {step === 7 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Review & Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Large full-width preview */}
                  <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-neutral-900">
                    {/* Header image */}
                    {selectedPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedPhoto.regular || selectedPhoto.thumb} alt={selectedPhoto.alt} className="w-full h-56 sm:h-72 md:h-80 object-cover" />
                    ) : headerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={headerUrl} alt="Header" className="w-full h-56 sm:h-72 md:h-80 object-cover" />
                    ) : null}
                    <div className="px-5 sm:px-8 py-6">
                      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">{draft?.title || 'Post title'}</h1>
                      <div className={`mt-2 ${styles.markdown}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                          {combinedMarkdown || "Your content preview will appear here once you write the intro/body."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Quick check: title, image, and content look good? If so, publish below.
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button asChild variant="outline"><Link href="/admin/blog">Cancel</Link></Button>
                    <Button
                      onClick={() => {
                        if (!draft) return;
                        startSaveDraft(async () => {
                          if (editingId) {
                            await updateAssistPostAction({
                              id: editingId,
                              title: draft.title,
                              outline: draft.outline,
                              intro: draft.intro,
                              body: body || undefined,
                              imageUrl: selectedPhoto?.regular || headerUrl || null,
                              publish: false,
                            });
                          } else {
                            await publishAssistPostAction({
                              title: draft.title,
                              outline: draft.outline,
                              intro: draft.intro,
                              body: body || undefined,
                              imageUrl: selectedPhoto?.regular || headerUrl || null,
                              imageCredit: selectedPhoto ? { name: selectedPhoto.creditName, link: selectedPhoto.creditLink } : null,
                              product: selectedProduct || null,
                              publish: false,
                            });
                          }
                          window.location.href = "/admin/blog";
                        });
                      }}
                      disabled={!draft || savingDraft || publishing}
                      variant="secondary"
                      className="gap-2"
                    >
                      {savingDraft && <Loader2 className="h-4 w-4 animate-spin" />} Save as Draft
                    </Button>
                    <Button onClick={publish} disabled={!draft || publishing} className="gap-2">
                      {publishing && <Loader2 className="h-4 w-4 animate-spin" />} Publish Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nav controls */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1) as (typeof steps)[number]["key"]) } disabled={step === 1 || loadingExisting} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button variant="default" onClick={() => setStep((s) => Math.min(steps.length as number, s + 1) as (typeof steps)[number]["key"]) } disabled={step === steps.length || loadingExisting} className="gap-1">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Blocking overlay while generating */}
          </motion.div>

          {/* Preview column (desktop): keep mounted, animate width for smoother UX */}
          {step !== 7 && (
          <motion.div
            className="hidden lg:block transform-gpu"
            animate={{ width: showPreview ? PREVIEW_WIDTH : 0, opacity: showPreview ? 1 : 0 }}
            initial={false}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            style={{ overflow: 'hidden', pointerEvents: showPreview ? 'auto' : 'none' }}
            aria-hidden={!showPreview}
          >
            <div className="sticky top-24 w-[380px]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Live Preview</CardTitle>
                </CardHeader>
                <CardContent className="max-h-[70vh] overflow-auto p-4">
                  {selectedPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPhoto.regular || selectedPhoto.thumb} alt={selectedPhoto.alt} className="w-full h-40 object-cover rounded-md" />
                  ) : headerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={headerUrl} alt="Header" className="w-full h-40 object-cover rounded-md" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-neutral-800 rounded-md grid place-items-center text-xs text-gray-500">No header image</div>
                  )}
                  <h2 className="mt-4 text-xl font-bold">{draft?.title || 'Post title'}</h2>
                  {selectedPhoto?.creditName && (
                    <div className="mt-1 text-[11px] text-gray-500">Photo: <a href={selectedPhoto.creditLink} className="underline" target="_blank" rel="noreferrer">{selectedPhoto.creditName}</a></div>
                  )}
                  <div className={`mt-3 ${styles.markdown}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}>
                      {combinedMarkdown || "Start writing in the steps to see a preview here."}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
          )}
        </motion.div>
      </div>
      {/* Full-screen overlays mounted at root to avoid transform clipping */}
      {generatingContent && (
        <div className="fixed inset-0 h-screen w-screen z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="text-sm text-gray-700 dark:text-gray-200">
              Generating full article… Please keep this tab open.
            </div>
          </div>
        </div>
      )}
      {applyingSeo && (
        <div className="fixed inset-0 h-screen w-screen z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="text-sm text-gray-700 dark:text-gray-200">
              Applying SEO updates…
            </div>
          </div>
        </div>
      )}
      {loadingExisting && (
        <div className="fixed inset-0 h-screen w-screen z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="rounded-lg bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10 p-6 shadow-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div className="text-sm text-gray-700 dark:text-gray-200">
              Loading existing post…
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
