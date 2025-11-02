"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTrendingTopicsAction, draftAction, unsplashAction, listProductsAction, publishAssistPostAction, expandAction } from "./actions";
import type { UnsplashPhoto } from "@/lib/media/unsplash";
import { Loader2, ImageIcon, Lightbulb, Rocket, ListChecks } from "lucide-react";

type Product = { id: string; name: string; slug: string };

export default function BlogAssistPage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [draft, setDraft] = useState<{ title: string; outline: string; intro: string } | null>(null);
  const [body, setBody] = useState<string>("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [unsplashMissingKey, setUnsplashMissingKey] = useState(false);
  const [imageIdx, setImageIdx] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [publishing, startPublish] = useTransition();
  const [savingDraft, startSaveDraft] = useTransition();
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [drafting, setDrafting] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  useEffect(() => {
    setLoadingTopics(true);
    getTrendingTopicsAction().then((t) => {
      setTopics(t);
      setLoadingTopics(false);
    });
    listProductsAction().then(setProducts);
  }, []);

  const doDraft = async (topic: string) => {
    setDrafting(true);
    try {
      const d = await draftAction(topic);
      setDraft(d);
      setSelectedTopic(topic);
      setPhotos([]);
      setImageIdx(null);
      setBody("");
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

  const publish = () => {
    if (!draft) return;
    startPublish(async () => {
      await publishAssistPostAction({
        title: draft.title,
        outline: draft.outline,
        intro: draft.intro,
        body: body || undefined,
        imageUrl: selectedPhoto?.regular || null,
        imageCredit: selectedPhoto ? { name: selectedPhoto.creditName, link: selectedPhoto.creditLink } : null,
        product: selectedProduct || null,
        publish: true,
      });
      // navigate back to admin blog list
      window.location.href = "/admin/blog";
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100">
      <div className="container mx-auto px-4 lg:px-6 pt-28 pb-12 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">BlogAssist</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Draft an SEO-friendly post with real data, fast.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin/blog">Back to Blog</Link>
          </Button>
        </div>

        {/* Step 1: Topic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Pick a Topic</CardTitle>
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

        {/* Step 2: Outline + Intro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Outline & Intro</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={draft?.title || ""} onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))} placeholder="Post title" />
              <Separator />
              <Button variant="secondary" onClick={searchPhotos} disabled={!draft || loadingPhotos} className="gap-2 w-full">
                {loadingPhotos && <Loader2 className="h-4 w-4 animate-spin" />} Search Header Images
              </Button>
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

        {/* Step 2.5: Full Body */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4" /> Full Body</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea rows={14} placeholder="Click 'Generate Full Content' or write your own." value={body} onChange={(e) => setBody(e.target.value)} aria-busy={generatingContent} />
            <div className="mt-1 text-xs text-gray-500">Markdown supported. Keep sections skimmable with H2/H3 subheadings.</div>
          </CardContent>
        </Card>

        {/* Blocking overlay while generating */}
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

        {/* Step 3: Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Header Image</CardTitle>
          </CardHeader>
          <CardContent>
            {!Array.isArray(photos) || photos.length === 0 ? (
              <div className="text-sm text-gray-500">
                {unsplashMissingKey
                  ? 'No images: set UNSPLASH_ACCESS_KEY in your environment and redeploy.'
                  : 'No images loaded yet. Click "Search Header Images" above or try a broader topic.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {photos.map((p, idx) => (
                  <button key={p.id} onClick={() => setImageIdx(idx)} className={`rounded overflow-hidden border ${imageIdx === idx ? 'ring-2 ring-blue-500' : 'border-black/10 dark:border-white/10'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.thumb} alt={p.alt} className="w-full h-24 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 4: Feature Product */}
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

        {/* Save / Publish */}
        <div className="flex justify-end gap-2">
          <Button asChild variant="outline"><Link href="/admin/blog">Cancel</Link></Button>
          <Button
            onClick={() => {
              if (!draft) return;
              startSaveDraft(async () => {
                await publishAssistPostAction({
                  title: draft.title,
                  outline: draft.outline,
                  intro: draft.intro,
                  body: body || undefined,
                  imageUrl: selectedPhoto?.regular || null,
                  imageCredit: selectedPhoto ? { name: selectedPhoto.creditName, link: selectedPhoto.creditLink } : null,
                  product: selectedProduct || null,
                  publish: false,
                });
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
      </div>
    </div>
  );
}
