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

// MusicBrainz requires a User-Agent header
const headers = {
  'Accept': 'application/json',
  'User-Agent': 'MediaLog/1.0 (personal-project)',
};

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
      artist: rg['artist-credit']?.[0]?.name || 'Unknown Artist',
      artistId: rg['artist-credit']?.[0]?.artist?.id || '',
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
