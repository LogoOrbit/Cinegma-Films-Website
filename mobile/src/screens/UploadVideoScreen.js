import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

export default function UploadVideoScreen() {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState('video');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: mediaType === 'video' ? 'video/*' : 'audio/*',
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    setFile(asset);
    if (!title) setTitle(asset.name?.replace(/\.[^.]+$/, '') || 'Untitled');
  };

  const upload = async () => {
    if (!file) { Alert.alert('Error', 'Pick a file first'); return; }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      Alert.alert('Error', 'File too large. Max 50 MB.');
      return;
    }
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mime = file.mimeType || (mediaType === 'video' ? 'video/mp4' : 'audio/mpeg');
      const dataUrl = `data:${mime};base64,${base64}`;
      const res = await api('/api/video-upload', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name || 'file',
          dataUrl,
          caption: caption || null,
          mediaType,
        }),
      });
      setResult(res);
    } catch (e) {
      Alert.alert('Upload failed', e.message);
    }
    setUploading(false);
  };

  const copyUrl = async () => {
    if (result?.url) {
      await Clipboard.setStringAsync(result.url);
      Alert.alert('Copied', 'URL copied to clipboard');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <PageHeader
        kicker="Upload"
        title="Upload Media"
        desc="Upload videos or audio. Files are compressed and stored on CDN."
      />

      <GlassCard>
        <Text style={styles.label}>TITLE</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Janjaal — Official Trailer"
          placeholderTextColor={colors.faint}
        />

        <Text style={styles.label}>CAPTION (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={caption}
          onChangeText={setCaption}
          placeholder="A short description"
          placeholderTextColor={colors.faint}
        />

        <Text style={styles.label}>TYPE</Text>
        <View style={styles.typeRow}>
          {['video', 'audio'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, mediaType === t && styles.typeBtnActive]}
              onPress={() => setMediaType(t)}
            >
              <Text style={[styles.typeText, mediaType === t && styles.typeTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.dropZone} onPress={pickFile} activeOpacity={0.7}>
          {file ? (
            <>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileSize}>
                {(file.size / 1048576).toFixed(1)} MB
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.dropIcon}>{mediaType === 'video' ? '🎬' : '🎵'}</Text>
              <Text style={styles.dropText}>Tap to pick a file</Text>
              <Text style={styles.dropSmall}>
                {mediaType === 'video' ? 'MP4, MOV, WebM' : 'MP3, WAV, OGG'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadBtn, (!file || uploading) && styles.btnDisabled]}
          onPress={upload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.result}>
            <Text style={styles.resultOk}>
              Uploaded · {(result.size / 1048576).toFixed(1)} MB stored
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyUrl}>
              <Text style={styles.copyText} numberOfLines={1}>{result.url}</Text>
              <Text style={styles.copyLabel}>Copy</Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 10, letterSpacing: 2, color: colors.faint, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 11, padding: 14, color: colors.txt, fontSize: 15,
  },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 999,
    borderWidth: 1, borderColor: colors.lineStrong, alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  typeText: { color: colors.mut, fontSize: 14 },
  typeTextActive: { color: '#111', fontWeight: '500' },
  dropZone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong,
    borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropIcon: { fontSize: 36, marginBottom: 10 },
  dropText: { fontSize: 15, color: colors.txt, marginBottom: 4 },
  dropSmall: { fontSize: 12, color: colors.faint },
  fileName: { fontSize: 15, color: colors.txt, fontWeight: '500' },
  fileSize: { fontSize: 13, color: colors.faint, marginTop: 4 },
  uploadBtn: {
    backgroundColor: colors.goldBright, borderRadius: 999,
    paddingVertical: 14, alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.4 },
  uploadBtnText: { color: '#111', fontWeight: '600', fontSize: 14 },
  result: { marginTop: 20 },
  resultOk: { color: colors.ok, fontWeight: '500', fontSize: 14, marginBottom: 12 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.lineStrong,
    borderRadius: 11, padding: 12,
  },
  copyText: { flex: 1, color: colors.goldBright, fontSize: 12 },
  copyLabel: { color: colors.txt, fontSize: 12 },
});
