// src/app/api/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/db/connect';
import Unit from '@/models/Unit';
import VideoAsset from '@/models/VideoAsset';
import { Types } from 'mongoose';

type Field =
    | { id: string; type: 'text_short' | 'text_long'; label: string; required?: boolean; minLen?: number; maxLen?: number; placeholder?: string }
    | { id: string; type: 'slider'; label: string; required?: boolean; min?: number; max?: number; step?: number }
    | { id: string; type: 'checkbox'; label: string; required?: boolean }
    | { id: string; type: 'chips'; label: string; required?: boolean; options?: string[] }
    | { id: string; type: 'score_group'; label: string };

type UnitLean = {
    _id: Types.ObjectId;
    programSlug: string;
    unitType: 'day';
    unitIndex: number;
    title: string;
    introText?: string;
    mantra?: string;
    durationMin?: number;
    videoAssetId?: Types.ObjectId;
    journalSchema?: { fields: Field[] };
};

type VideoLean = {
    _id: Types.ObjectId;
    provider: 'mux' | 'bunny' | 'vdocipher' | 'file';
    videoId: string;
    poster?: string;
    captionsUrl: string;
    chaptersUrl?: string;
    transcriptUrl?: string;
    thumbnailsVtt?: string;
};

export async function GET(req: NextRequest) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const programSlug = (searchParams.get('programme') || 'reset-7').toLowerCase();
    const day = Number(searchParams.get('day') || 1);

    // ✅ findOne + lean<T>
    const unit = await Unit.findOne({ programSlug, unitType: 'day', unitIndex: day, status: 'published' }).lean<UnitLean | null>();

    if (!unit) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const video = unit.videoAssetId ? await VideoAsset.findById(unit.videoAssetId).lean<VideoLean | null>() : null;

    return NextResponse.json({ unit, video });
}
