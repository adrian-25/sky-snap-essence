import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ImageRow {
  id: string;
  image_url: string;
  main_face_cluster_id: string | null;
  face_embeddings: any;
}

interface ClusterGroup {
  clusterId: string;
  images: ImageRow[];
}

// Album label auto-mapping for illustration
type AlbumLabelsMap = Record<string, string>;
const defaultAlbumNames = ["Me", "Family", "Friends", "Others"];

export default function AlbumsPage() {
  const [groups, setGroups] = useState<ClusterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrouped = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('images')
        .select('id, image_url, main_face_cluster_id, face_embeddings')
        .order('uploaded_at', { ascending: false });
      if (error) {
        setLoading(false);
        return;
      }
      // Group by main_face_cluster_id
      const map: Record<string, ImageRow[]> = {};
      for (const row of data as ImageRow[]) {
        const cid = row.main_face_cluster_id || 'unclustered';
        if (!map[cid]) map[cid] = [];
        map[cid].push(row);
      }
      setGroups(Object.entries(map).map(([k, v]) => ({ clusterId: k, images: v })));
      setLoading(false);
    };
    fetchGrouped();
  }, []);

  // Album labels (future: fetch from an albums table or allow renaming)
  const getLabel = (clusterId: string, idx: number) => {
    if (clusterId === 'unclustered') return 'Unsorted';
    return defaultAlbumNames[idx % defaultAlbumNames.length] + ` (${clusterId.slice(0, 4)})`;
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-4">Albums</h2>
      {loading ? (
        <div className="text-center text-muted-foreground py-8 animate-pulse">Loading albums...</div>
      ) : groups.length === 0 ? (
        <div className="text-lg text-muted-foreground">No albums found.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((grp, i) => (
            <motion.div
              className="rounded-xl shadow-lg overflow-hidden bg-white dark:bg-zinc-900/90 border border-zinc-100 dark:border-zinc-800"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 100, damping: 14 }}
              key={grp.clusterId}
            >
              <Card>
                <CardContent className="p-0">
                  <img
                    src={grp.images[0]?.image_url}
                    alt="Album sample"
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4 flex flex-col gap-2">
                    <CardTitle>{getLabel(grp.clusterId, i)}</CardTitle>
                    <div className="flex gap-2 items-center text-zinc-500 dark:text-zinc-300">
                      <span className="font-bold text-xl">{grp.images.length}</span>
                      <span>photo{grp.images.length > 1 && 's'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
