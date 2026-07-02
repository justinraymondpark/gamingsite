const MB_BASE_URL = 'https://musicbrainz.org/ws/2';
const COVER_ART_URL = 'https://coverartarchive.org';

export type MBReleaseGroup = {
  id: string;
  title: string;
  'primary-type'?: string;
  'first-release-date'?: string;
  'artist-credit'?: { name: string; artist: { id: string; name: string } }[];
  tags?: { name: string; count: number }[];
};

type MBArtistCredit = {
  name?: string;
  joinphrase?: string;
  artist?: { id: string; name: string };
};

export type MBRecording = {
  id: string;
  title: string;
  length?: number;
  'first-release-date'?: string;
  'artist-credit'?: MBArtistCredit[];
  tags?: { name: string; count: number }[];
  releases?: {
    id: string;
    title: string;
    date?: string;
    'release-group'?: {
      id: string;
      'primary-type'?: string;
    };
  }[];
};

export type MBArtist = {
  id: string;
  name: string;
  type?: string;
  country?: string;
  'life-span'?: { begin?: string; end?: string };
  tags?: { name: string; count: number }[];
};

export type MBSearchResult = {
  title: string;
  artist: string;
  artistId: string;
  releaseGroupId: string;
  releaseDate: string;
  type: string;
  genres: string[];
  coverArtUrl: string | null;
};

export type MBTrackSearchResult = {
  title: string;
  artist: string;
  artistId: string;
  recordingId: string;
  releaseGroupId: string | null;
  releaseTitle: string;
  releaseDate: string;
  type: 'Track';
  genres: string[];
  coverArtUrl: string | null;
  durationMs: number | null;
};

// MusicBrainz requires a User-Agent header
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'MediaLog/1.0 (personal-project)',
};

function getArtistName(artistCredit?: MBArtistCredit[]): string {
  const name = artistCredit
    ?.map((credit) => `${credit.name || credit.artist?.name || ''}${credit.joinphrase || ''}`)
    .join('')
    .trim();
  return name || 'Unknown Artist';
}

function getArtistId(artistCredit?: MBArtistCredit[]): string {
  return artistCredit?.[0]?.artist?.id || '';
}

function quoteSearchValue(value: string): string {
  return `"${value.trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function stripLeadingTitleNoise(value: string): string {
  return value.replace(/^(hey|yo)\s+/i, '').trim();
}

function getUniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function buildRecordingSearchQuery(queryStr: string): string {
  const query = queryStr.trim();
  const words = query.split(/\s+/).filter(Boolean);

  if (words.length < 3) {
    return query;
  }

  const clauses = [`recording:${quoteSearchValue(query)}`];
  const maxArtistWords = Math.min(4, words.length - 1);

  for (let artistWordCount = 1; artistWordCount <= maxArtistWords; artistWordCount++) {
    const artist = words.slice(0, artistWordCount).join(' ');
    const title = words.slice(artistWordCount).join(' ');
    const titleVariants = getUniqueValues([title, stripLeadingTitleNoise(title)]);

    titleVariants.forEach((titleVariant) => {
      clauses.push(`(artistname:${quoteSearchValue(artist)} AND recording:${quoteSearchValue(titleVariant)})`);
    });
  }

  return clauses.join(' OR ');
}

export async function searchMusic(queryStr: string): Promise<MBSearchResult[]> {
  try {
    const response = await fetch(
      `${MB_BASE_URL}/release-group/?query=${encodeURIComponent(queryStr)}&limit=10&fmt=json`,
      { headers }
    );

    if (!response.ok) throw new Error('Failed to search MusicBrainz');

    const data = await response.json();
    const releaseGroups: MBReleaseGroup[] = data['release-groups'] || [];

    return releaseGroups.map((rg) => ({
      title: rg.title,
      artist: getArtistName(rg['artist-credit']),
      artistId: getArtistId(rg['artist-credit']),
      releaseGroupId: rg.id,
      releaseDate: rg['first-release-date'] || '',
      type: rg['primary-type'] || 'Other',
      genres: (rg.tags || []).slice(0, 5).map(t => t.name),
      coverArtUrl: `${COVER_ART_URL}/release-group/${rg.id}/front-250`,
    }));
  } catch (error) {
    console.error('Error searching MusicBrainz:', error);
    return [];
  }
}

export async function searchTracks(queryStr: string): Promise<MBTrackSearchResult[]> {
  try {
    const query = buildRecordingSearchQuery(queryStr);
    const response = await fetch(
      `${MB_BASE_URL}/recording/?query=${encodeURIComponent(query)}&limit=10&fmt=json`,
      { headers }
    );

    if (!response.ok) throw new Error('Failed to search MusicBrainz tracks');

    const data = await response.json();
    const recordings: MBRecording[] = data.recordings || [];

    return recordings.map((recording) => {
      const release = recording.releases?.[0];
      const releaseGroupId = release?.['release-group']?.id || null;

      return {
        title: recording.title,
        artist: getArtistName(recording['artist-credit']),
        artistId: getArtistId(recording['artist-credit']),
        recordingId: recording.id,
        releaseGroupId,
        releaseTitle: release?.title || '',
        releaseDate: recording['first-release-date'] || release?.date || '',
        type: 'Track',
        genres: (recording.tags || []).slice(0, 5).map(t => t.name),
        coverArtUrl: releaseGroupId ? `${COVER_ART_URL}/release-group/${releaseGroupId}/front-250` : null,
        durationMs: recording.length || null,
      };
    });
  } catch (error) {
    console.error('Error searching MusicBrainz tracks:', error);
    return [];
  }
}

export async function searchArtists(queryStr: string): Promise<MBArtist[]> {
  try {
    const response = await fetch(
      `${MB_BASE_URL}/artist/?query=${encodeURIComponent(queryStr)}&limit=10&fmt=json`,
      { headers }
    );

    if (!response.ok) throw new Error('Failed to search artists');

    const data = await response.json();
    return data.artists || [];
  } catch (error) {
    console.error('Error searching artists:', error);
    return [];
  }
}

// Check if cover art exists (Cover Art Archive can 404)
export async function getCoverArtUrl(releaseGroupId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${COVER_ART_URL}/release-group/${releaseGroupId}`,
      { method: 'HEAD' }
    );
    if (response.ok) {
      return `${COVER_ART_URL}/release-group/${releaseGroupId}/front-250`;
    }
    return null;
  } catch {
    return null;
  }
}
