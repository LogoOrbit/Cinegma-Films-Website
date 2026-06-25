import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme';
import { api } from '../api';
import PageHeader from '../components/PageHeader';
import GlassCard from '../components/GlassCard';

export default function UploadImageScreen() {
  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('');
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      base64: true,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    setImage(asset);
    const name = asset.fileName || 'image.jpg';
    if (!filename) setFilename(name.replace(/\.[^.]+$/, ''));
    if (!title) setTitle(name.replace(/\.[^.]+$/, ''));
  };

  const upload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Give the post a title first');
      return;
    }
    if (!image) {
      Alert.alert('Error', 'Pick an image first');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = `data:image/jpeg;base64,${image.base64}`;
      const res = await api('/api/media-upload', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          filename: filename || 'image.jpg',
          caption: caption || null,
          dataUrl,
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
        kicker="Optimize"
        title="Upload Image"
        desc="Add a title, pick an image, and we convert it to AVIF on CDN."
      />

      <GlassCard>
        <Text style={styles.label}>POST TITLE</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Janjaal — Behind the Scenes"
          placeholderTextColor={colors.faint}
        />

        <Text style={styles.label}>FILE NAME (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={filename}
          onChangeText={setFilename}
          placeholder="Internal asset name"
          placeholderTextColor={colors.faint}
        />

        <Text style={styles.label}>CAPTION (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={caption}
          onChangeText={setCaption}
          placeholder="Short description / alt text"
          placeholderTextColor={colors.faint}
        />

        <TouchableOpacity style={styles.dropZone} onPress={pickImage} activeOpacity={0.7}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <>
              <Text style={styles.dropIcon}>+</Text>
              <Text style={styles.dropText}>Tap to pick an image</Text>
              <Text style={styles.dropSmall}>JPG, PNG, WebP, HEIC</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.uploadBtn, (!image || uploading) && styles.btnDisabled]}
          onPress={upload}
          disabled={!image || uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color="#111" size="small" />
          ) : (
            <Text style={styles.uploadBtnText}>Optimize & Upload</Text>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.result}>
            <Text style={styles.resultOk}>
              Uploaded · {(result.size / 1024).toFixed(0)} KB · saved as draft
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyUrl}>
              <Text style={styles.copyText} numberOfLines={1}>{result.url}</Text>
              <Text style={styles.copyLabel}>Copy</Text>
            </TouchableOpacity>
            <Image source={{ uri: result.url }} style={styles.resultImg} />
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
  dropZone: {
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong,
    borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropIcon: { fontSize: 36, color: colors.gold, marginBottom: 10 },
  dropText: { fontSize: 15, color: colors.txt, marginBottom: 4 },
  dropSmall: { fontSize: 12, color: colors.faint },
  preview: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12 },
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
  resultImg: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12, marginTop: 14 },
});
