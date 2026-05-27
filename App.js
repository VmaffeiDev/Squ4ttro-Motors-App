import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const { CONTACTS, FALLBACK_VEHICLES, SITE_URL, fetchInventory } = require('./src/inventory');

const LOGO_URL = `${SITE_URL}/sites/squ4ttromotors.com.br/img/img-logo-print.png`;

export default function App() {
  const [tab, setTab] = useState('stock');
  const [vehicles, setVehicles] = useState(FALLBACK_VEHICLES);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setVehicles(await fetchInventory());
      setError('');
    } catch {
      setError('Nao foi possivel atualizar o estoque do Revenda Mais agora. Mostrando uma amostra salva.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const brands = useMemo(() => {
    const unique = Array.from(new Set(vehicles.map((item) => item.brand).filter(Boolean)));
    return ['Todos', ...unique.sort((a, b) => a.localeCompare(b))];
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return vehicles.filter((item) => {
      const byBrand = brand === 'Todos' || item.brand === brand;
      return byBrand && (!q || item.searchText.includes(q));
    });
  }, [brand, query, vehicles]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.shell}>
        <Header loading={refreshing} onRefresh={() => load(true)} />
        {tab === 'stock' ? (
          <Stock
            brand={brand}
            brands={brands}
            error={error}
            filtered={filtered}
            loading={loading}
            onBrand={setBrand}
            onRefresh={() => load(true)}
            onSelect={setSelectedVehicle}
            query={query}
            refreshing={refreshing}
            setQuery={setQuery}
            total={vehicles.length}
          />
        ) : (
          <Contact />
        )}
        <Tabs active={tab} onChange={setTab} />
        <VehicleDetail item={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
      </View>
    </SafeAreaView>
  );
}

function Header({ loading, onRefresh }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
        <IconButton icon="refresh" loading={loading} onPress={onRefresh} />
      </View>
      <Text style={styles.kicker}>Curitiba - PR</Text>
      <Text style={styles.title}>Seminovos com atendimento direto</Text>
      <Text style={styles.subtitle}>Estoque oficial do Revenda Mais, fotos reais e contato rapido com a equipe.</Text>
    </View>
  );
}

function Stock({ brand, brands, error, filtered, loading, onBrand, onRefresh, onSelect, query, refreshing, setQuery, total }) {
  return (
    <View style={styles.content}>
      <View style={styles.searchPanel}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons color="#7a7d86" name="magnify" size={21} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Buscar por marca ou modelo"
            placeholderTextColor="#7a7d86"
            style={styles.searchInput}
            value={query}
          />
        </View>
        <View style={styles.countRow}>
          <Text style={styles.count}>{filtered.length} encontrados</Text>
          <Text style={styles.muted}>{total} no Revenda Mais</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
        {brands.map((item) => (
          <Pressable key={item} onPress={() => onBrand(item)} style={[styles.chip, brand === item && styles.chipActive]}>
            <Text style={[styles.chipText, brand === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.notice}>
          <MaterialCommunityIcons color="#9b1c31" name="alert-circle-outline" size={18} />
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={loading ? <State icon="loading" text="Carregando estoque..." /> : <State icon="car-off" text="Nenhum veiculo encontrado." />}
        refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} tintColor="#c41e3a" />}
        renderItem={({ item }) => <Vehicle item={item} onSelect={onSelect} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function Vehicle({ item, onSelect }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.carImage} />
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.carTitle}>{item.title}</Text>
        <Text style={styles.price}>{item.priceLabel}</Text>
        <View style={styles.specs}>
          <Spec icon="calendar-range" text={item.year} />
          <Spec icon="speedometer" text={item.kmLabel} />
          <Spec icon="fuel" text={item.fuel} />
          <Spec icon="car-shift-pattern" text={item.gear || item.type} />
        </View>
        <Info icon="storefront-outline" text={item.seller} />
        <View style={styles.actions}>
          <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp(item)} />
          <Button icon="text-box-search-outline" text="Detalhes" tone="light" onPress={() => onSelect(item)} />
        </View>
      </View>
    </View>
  );
}

function VehicleDetail({ item, onClose }) {
  if (!item) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible>
      <SafeAreaView style={styles.detailSafe}>
        <View style={styles.detailTopbar}>
          <Text style={styles.detailKicker}>Revenda Mais</Text>
          <IconButton icon="close" onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
          <Image source={{ uri: item.image }} style={styles.detailImage} />
          <Text style={styles.detailTitle}>{item.title}</Text>
          <Text style={styles.price}>{item.priceLabel}</Text>
          <View style={styles.specs}>
            <Spec icon="calendar-range" text={item.year} />
            <Spec icon="speedometer" text={item.kmLabel} />
            <Spec icon="fuel" text={item.fuel} />
            <Spec icon="car-shift-pattern" text={item.gear || 'Cambio sob consulta'} />
            <Spec icon="engine-outline" text={item.motor ? `Motor ${item.motor}` : 'Motor sob consulta'} />
            <Spec icon="palette-outline" text={item.color || 'Cor sob consulta'} />
          </View>

          <View style={styles.detailBlock}>
            <Info icon="storefront-outline" text={item.seller} />
            <Info icon="map-marker-outline" text={item.address} />
            <Info icon="phone" text={item.phone} />
          </View>

          {item.accessories.length ? (
            <View style={styles.detailBlock}>
              <Text style={styles.blockTitle}>Opcionais</Text>
              <View style={styles.accessoryGrid}>
                {item.accessories.slice(0, 18).map((accessory) => (
                  <View key={accessory} style={styles.accessory}>
                    <Text style={styles.accessoryText}>{accessory}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {item.description ? (
            <View style={styles.detailBlock}>
              <Text style={styles.blockTitle}>Descricao</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp(item)} />
            <Button icon="phone" text="Ligar" tone="light" onPress={() => openUrl(`tel:${item.phoneLink}`)} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Contact() {
  return (
    <ScrollView contentContainerStyle={styles.contact} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Atendimento Squ4ttro Motors</Text>
      <Text style={styles.sectionText}>Escolha uma unidade ou fale agora pelo WhatsApp principal.</Text>
      <View style={styles.actions}>
        <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp()} />
        <Button icon="web" text="Site" onPress={() => openUrl(SITE_URL)} />
      </View>

      {CONTACTS.map((store) => (
        <View key={store.name} style={styles.store}>
          <View style={styles.storeHead}>
            <View style={styles.storeIcon}>
              <MaterialCommunityIcons color="#fff" name="storefront-outline" size={22} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeInfo}>{store.address}</Text>
            </View>
          </View>
          <Info icon="phone" text={store.phone} />
          <Info icon="whatsapp" text={store.whatsappLabel} />
          <Info icon="email-outline" text={store.email} />
          <Info icon="clock-outline" text={store.hours} />
          <View style={styles.actions}>
            <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp(null, store.whatsapp)} />
            <Button icon="phone" text="Ligar" tone="light" onPress={() => openUrl(`tel:${store.phoneLink}`)} />
            <Button icon="map-marker" text="Mapa" tone="light" onPress={() => openMap(store.address)} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function Tabs({ active, onChange }) {
  return (
    <View style={styles.tabs}>
      {[
        ['stock', 'car-search', 'Estoque'],
        ['contact', 'phone-message', 'Contato'],
      ].map(([key, icon, label]) => (
        <Pressable key={key} onPress={() => onChange(key)} style={[styles.tab, active === key && styles.tabActive]}>
          <MaterialCommunityIcons color={active === key ? '#fff' : '#747883'} name={icon} size={22} />
          <Text style={[styles.tabText, active === key && styles.tabTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Spec({ icon, text }) {
  return (
    <View style={styles.spec}>
      <MaterialCommunityIcons color="#747883" name={icon} size={16} />
      <Text numberOfLines={1} style={styles.specText}>{text}</Text>
    </View>
  );
}

function Info({ icon, text }) {
  return (
    <View style={styles.info}>
      <MaterialCommunityIcons color="#747883" name={icon} size={18} />
      <Text style={styles.storeInfo}>{text}</Text>
    </View>
  );
}

function Button({ icon, onPress, text, tone = 'dark' }) {
  return (
    <Pressable onPress={onPress} style={[styles.button, tone === 'whatsapp' && styles.whatsapp, tone === 'light' && styles.light]}>
      <MaterialCommunityIcons color={tone === 'light' ? '#17181c' : '#fff'} name={icon} size={18} />
      <Text style={[styles.buttonText, tone === 'light' && styles.darkText]}>{text}</Text>
    </Pressable>
  );
}

function IconButton({ icon, loading, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.iconButton}>
      {loading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialCommunityIcons color="#fff" name={icon} size={23} />}
    </Pressable>
  );
}

function State({ icon, text }) {
  return (
    <View style={styles.state}>
      {icon === 'loading' ? <ActivityIndicator color="#c41e3a" size="large" /> : <MaterialCommunityIcons color="#9ca0aa" name={icon} size={40} />}
      <Text style={styles.mutedStrong}>{text}</Text>
    </View>
  );
}

function openWhatsapp(vehicle, phone = '5541984606278') {
  const targetPhone = vehicle && vehicle.whatsapp ? vehicle.whatsapp : phone;
  const message = vehicle
    ? `Ola, vi o anuncio do ${vehicle.title} (${vehicle.priceLabel}) no app da Squ4ttro Motors e gostaria de saber mais. ${vehicle.link}`
    : 'Ola, vim pelo app da Squ4ttro Motors e gostaria de atendimento.';
  openUrl(`https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`);
}

function openMap(address) {
  openUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`);
}

function openUrl(url) {
  Linking.openURL(url).catch(() => {});
}

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#101115' },
  shell: { flex: 1, backgroundColor: '#f4f5f7' },
  detailSafe: { flex: 1, backgroundColor: '#f4f5f7' },
  detailTopbar: { alignItems: 'center', backgroundColor: '#111217', flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  detailKicker: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  detailScroll: { padding: 16, paddingBottom: 36 },
  detailImage: { aspectRatio: 16 / 10, backgroundColor: '#eceef2', borderRadius: 8, width: '100%' },
  detailTitle: { color: '#17181c', fontSize: 24, fontWeight: '900', lineHeight: 29, marginTop: 15 },
  detailBlock: { backgroundColor: '#fff', borderColor: '#e3e5eb', borderRadius: 8, borderWidth: 1, marginTop: 14, padding: 14 },
  blockTitle: { color: '#17181c', fontSize: 15, fontWeight: '900', marginBottom: 9 },
  accessoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  accessory: { backgroundColor: '#f0f1f4', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  accessoryText: { color: '#454954', fontSize: 12, fontWeight: '800' },
  description: { color: '#454954', fontSize: 13, fontWeight: '700', lineHeight: 20 },
  header: { backgroundColor: '#111217', padding: 18, paddingTop: 12, paddingBottom: 22 },
  brandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  logo: { height: 48, width: 214 },
  iconButton: { alignItems: 'center', backgroundColor: '#c41e3a', borderRadius: 8, height: 42, justifyContent: 'center', width: 42 },
  kicker: { color: '#ff5a70', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32, marginTop: 6 },
  subtitle: { color: '#c9cbd1', fontSize: 14, lineHeight: 20, marginTop: 8 },
  content: { flex: 1 },
  searchPanel: { backgroundColor: '#fff', borderBottomColor: '#e4e6eb', borderBottomWidth: 1, padding: 18, paddingBottom: 12 },
  searchBox: { alignItems: 'center', backgroundColor: '#f0f1f4', borderRadius: 8, flexDirection: 'row', minHeight: 48, paddingHorizontal: 14 },
  searchInput: { color: '#17181c', flex: 1, fontSize: 15, minHeight: 48, paddingHorizontal: 10 },
  countRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  count: { color: '#17181c', fontSize: 14, fontWeight: '800' },
  muted: { color: '#747883', fontSize: 13, fontWeight: '700' },
  mutedStrong: { color: '#747883', fontSize: 14, fontWeight: '800' },
  chipScroller: { backgroundColor: '#fff', flexGrow: 0, paddingHorizontal: 14, paddingVertical: 12 },
  chip: { backgroundColor: '#f0f1f4', borderRadius: 8, marginHorizontal: 4, paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: '#c41e3a' },
  chipText: { color: '#424550', fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  notice: { alignItems: 'center', backgroundColor: '#fff3f5', flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: 18 },
  noticeText: { color: '#7c1c2e', flex: 1, fontSize: 12, fontWeight: '700' },
  list: { padding: 14, paddingBottom: 108 },
  card: { backgroundColor: '#fff', borderColor: '#e3e5eb', borderRadius: 8, borderWidth: 1, marginBottom: 14, overflow: 'hidden' },
  carImage: { aspectRatio: 16 / 10, backgroundColor: '#eceef2', width: '100%' },
  cardBody: { padding: 14 },
  carTitle: { color: '#17181c', fontSize: 17, fontWeight: '900', lineHeight: 22 },
  price: { color: '#c41e3a', fontSize: 22, fontWeight: '900', marginTop: 7 },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  spec: { alignItems: 'center', backgroundColor: '#f0f1f4', borderRadius: 8, flexDirection: 'row', gap: 6, minHeight: 34, paddingHorizontal: 10 },
  specText: { color: '#454954', fontSize: 12, fontWeight: '800', maxWidth: 118 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  button: { alignItems: 'center', backgroundColor: '#17181c', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 },
  whatsapp: { backgroundColor: '#148a4b' },
  light: { backgroundColor: '#eef0f3' },
  buttonText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  darkText: { color: '#17181c' },
  contact: { padding: 18, paddingBottom: 108 },
  sectionTitle: { color: '#17181c', fontSize: 22, fontWeight: '900' },
  sectionText: { color: '#626671', fontSize: 14, lineHeight: 20, marginTop: 6 },
  store: { backgroundColor: '#fff', borderColor: '#e3e5eb', borderRadius: 8, borderWidth: 1, marginTop: 14, padding: 15 },
  storeHead: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, marginBottom: 12 },
  storeIcon: { alignItems: 'center', backgroundColor: '#c41e3a', borderRadius: 8, height: 42, justifyContent: 'center', width: 42 },
  storeName: { color: '#17181c', fontSize: 16, fontWeight: '900', lineHeight: 21 },
  storeInfo: { color: '#454954', flex: 1, fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 3 },
  info: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 8 },
  tabs: { backgroundColor: '#fff', borderTopColor: '#dfe1e6', borderTopWidth: 1, bottom: 0, flexDirection: 'row', gap: 10, left: 0, padding: 18, paddingTop: 10, position: 'absolute', right: 0 },
  tab: { alignItems: 'center', backgroundColor: '#eef0f3', borderRadius: 8, flex: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48 },
  tabActive: { backgroundColor: '#17181c' },
  tabText: { color: '#60646f', fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: '#fff' },
  state: { alignItems: 'center', gap: 12, justifyContent: 'center', minHeight: 260 },
});
