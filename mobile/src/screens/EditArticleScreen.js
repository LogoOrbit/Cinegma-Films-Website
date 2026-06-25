import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

const CATEGORIES = [
  ['news', 'News'],
  ['behind-the-scenes', 'Behind the Scenes'],
  ['press', 'Press'],
  ['awards', 'Awards'],
  ['blog', 'Blog'],
];

export default function EditArticleScreen({ route, navigation }) {
  const { id } = route.params || {};
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [category, setCategory] = useState('news');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    if (id) {
      api('/api/articles?id=' + id + '&drafts=1')
        .then((a) => {
          setTitle(a.title || '');
          setBody(a.body || '');
          setCoverUrl(a.cover_image_url || '');
          setCategory(a.category || 'news');
          setPublished(!!a.published);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [id]);

  const save = async (pub) => {
    if (!title.trim()) {
      Alert.alert('Error', 'Give it a title first');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        body,
        cover_image_url: coverUrl || null,
        category,
        published: pub !== undefined ? pub : published,
      };
      if (isEdit) {
        payload.id = id;
        await api('/api/articles', { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/api/articles', { method: 'POST', body: JSON.stringify(payload) });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setSaving(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Article', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api('/api/articles?id=' + id, { method: 'DELETE' });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingCover(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
      const res = await api('/api/media-upload', {
        method: 'POST',
        body: JSON.stringify({
          title: title || 'Cover',
          filename: 'cover.jpg',
          caption: null,
          dataUrl,
        }),
      });
      setCoverUrl(res.url);
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    }
    setUploadingCover(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.gold} size="large" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader kicker={isEdit ? 'Editing' : 'New Story'} title={isEdit ? 'Edit Article' : 'Compose'} />

      <GlassCard>
        <Text style={styles.label}>TITLE</Text>
        <TextInput
          style={[styles.input, styles.titleInput]}
          value={title}
          onChangeText={setTitle}
          placeholder="An unforgettable headline..."
          placeholderTextColor={colors.faint}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(([val, label]) => (
            <TouchableOpacity
              key={val}
              style={[styles.catBtn, category === val && styles.catBtnActive]}
              onPress={() => setCategory(val)}
            >
              <Text style={[styles.catText, category === val && styles.catTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>COVER IMAGE</Text>
        <View style={styles.coverRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            value={coverUrl}
            onChangeText={setCoverUrl}
            placeholder="Paste URL or upload"
            placeholderTextColor={colors.faint}
          />
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={pickCoverImage}
            disabled={uploadingCover}
          >
            <Text style={styles.uploadBtnText}>
              {uploadingCover ? '...' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { marginTop: 20 }]}>BODY — MARKDOWN</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={body}
          onChangeText={setBody}
          placeholder="Tell the story..."
          placeholderTextColor={colors.faint}
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          Markdown: # headings · **bold** · *italic* · {'>'} quote · ![alt](url) image
        </Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Published</Text>
          <Switch
            value={published}
            onValueChange={setPublished}
            trackColor={{ false: colors.lineStrong, true: colors.gold }}
            thumbColor={published ? '#111' : colors.mut}
          />
        </View>

        <View style={styles.actions}>
          {isEdit && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.draftBtn}
            onPress={() => save(false)}
            disabled={saving}
          >
            <Text style={styles.draftBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.publishBtn}
            onPress={() => save(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#111" size="small" />
            ) : (
              <Text style={styles.publishBtnText}>Save & Publish</Text>
            )}
          </TouchableOpacity>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { padding: 20, paddingBottom: 60 },
  label: {
    fontSize: 10, letterSpacing: 2, color: colors.faint,
    marginBottom: 8, marginTop: 16,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 11, padding: 14,
    color: colors.txt, fontSize: 15, marginBottom: 4,
  },
  titleInput: {
    fontFamily: 'serif', fontSize: 22, fontWeight: '500',
    backgroundColor: 'transparent',
    borderWidth: 0, borderBottomWidth: 1,
    borderRadius: 0, paddingHorizontal: 0,
  },
  bodyInput: { minHeight: 250, lineHeight: 24 },
  hint: { fontSize: 12, color: colors.faint, marginTop: 6, lineHeight: 18 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catBtn: {
    paddingVertical: 7, paddingHorizontal: 14,
    borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  catBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catText: { fontSize: 12, color: colors.mut },
  catTextActive: { color: '#111', fontWeight: '500' },
  coverRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  uploadBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 11, borderWidth: 1, borderColor: colors.lineStrong,
  },
  uploadBtnText: { color: colors.txt, fontSize: 13 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.line,
  },
  toggleLabel: { color: colors.txt, fontSize: 15 },
  actions: {
    flexDirection: 'row', gap: 10, marginTop: 24, flexWrap: 'wrap',
  },
  deleteBtn: {
    paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 999, backgroundColor: 'rgba(255,27,28,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,27,28,0.35)',
  },
  deleteBtnText: { color: colors.err, fontSize: 13, fontWeight: '500' },
  draftBtn: {
    paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: 999, borderWidth: 1, borderColor: colors.lineStrong,
  },
  draftBtnText: { color: colors.txt, fontSize: 13 },
  publishBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 999, backgroundColor: colors.goldBright,
    alignItems: 'center',
  },
  publishBtnText: { color: '#111', fontSize: 13, fontWeight: '600' },
});
