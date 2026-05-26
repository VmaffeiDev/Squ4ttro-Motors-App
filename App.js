import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const SITE_URL = 'https://squ4ttromotors.com.br';
const STOCK_URL = `${SITE_URL}/multipla/page/99`;
const LOGO_URL = `${SITE_URL}/sites/squ4ttromotors.com.br/img/img-logo-print.png`;

const CONTACTS = [
  {
    name: 'Squ4ttro Motors Hauer',
    phone: '(41) 3010-2019',
    phoneLink: '+554130102019',
    whatsapp: '5541984606278',
    whatsappLabel: '(41) 98460-6278',
    email: 'contato@s4curitiba.com.br',
    address: 'Rua Anne Frank, 2096 - Hauer - Curitiba/PR',
    hours: 'Segunda a sexta, 09:00 as 18:00. Sabados, 09:00 as 16:00.',
  },
  {
    name: 'Squ4ttro Motors Shopping Curitiba',
    phone: '(41) 3071-4646',
    phoneLink: '+554130714646',
    whatsapp: '5541992860989',
    whatsappLabel: '(41) 99286-0989',
    email: 'squ4ttromotors@hotmail.com',
    address: 'BR-116 Linha Verde, 7354 - Lojas 08/26 - Taruma - Curitiba/PR',
    hours: 'Segunda a sexta, 10:00 as 19:00. Sabados, 10:00 as 19:00. Domingos, 10:00 as 18:00.',
  },
];

const FALLBACK = [
  ['8124239', 'RENAULT KARDIAN EVOLUT. FLEX 1.0 TB 12V 5P AUT', '/carros/Renault/Kardian/Evolut-Flex-10-Tb-12v-5p-Aut/Renault-Kardian-Evolut-Flex-10-Tb-12v-5p-Aut-2025-Curitiba-Parana-8124239.html', 'https://s3.carro57.com.br/FC/7561/8124239_1_M_bce0dccd2f.jpeg', '99.800,00', '2025', '0', 'FLEX'],
  ['8058433', 'BYD DOLPHIN MINI GS', '/carros/Byd/Dolphin/Mini-Gs/Byd-Dolphin-Mini-Gs-2025-Curitiba-Parana-8058433.html', 'https://s3.carro57.com.br/FC/7561/8058433_5_M_789328324c.jpeg', '114.800,00', '2025', '16.124', 'ELETRICO'],
  ['8027198', 'VOLKSWAGEN POLO TRACK MA', '/carros/Volkswagen/Polo/Track-Ma/Volkswagen-Polo-Track-Ma-2025-Curitiba-Parana-8027198.html', 'https://s3.carro57.com.br/FC/7561/8027198_20_M_48f114543f.jpeg', '75.800,00', '2025', '45.548', 'FLEX'],
  ['7936468', 'HONDA ZR-V TOURING 2.0 16V 5P AUT', '/carros/Honda/Zr-v/Touring-20-16v-5p-Aut/Honda-Zr-v-Touring-20-16v-5p-Aut-2024-Curitiba-Parana-7936468.html', 'https://s3.carro57.com.br/FC/7561/7936468_23_M_22c3ecdc6d.jpeg', '163.800,00', '2024', '5.696', 'GASOLINA'],
  ['8085395', 'CHEVROLET ONIX 10MT LT2', '/carros/Chevrolet/Onix/10mt-Lt2/Chevrolet-Onix-10mt-Lt2-2024-Curitiba-Parana-8085395.html', 'https://s3.carro57.com.br/FC/7561/8085395_29_M_c5ca321a15.jpeg', '74.800,00', '2024', '52.082', 'FLEX'],
  ['8116987', 'FIAT CRONOS DRIVE 1.3 FLEX', '/carros/Fiat/Cronos/Drive-13-Flex/Fiat-Cronos-Drive-13-Flex-2023-Curitiba-Parana-8116987.html', 'https://s3.carro57.com.br/FC/7561/8116987_20_M_6f391be10a.jpeg', '79.800,00', '2023', '58.100', 'FLEX'],
].map(toVehicle);

export default function App() {
  const [tab, setTab] = useState('stock');
  const [vehicles, setVehicles] = useState(FALLBACK);
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const next = await fetchInventory();
      setVehicles(next);
      setError('');
    } catch {
      setError('Nao foi possivel atualizar o estoque agora. Mostrando uma amostra salva.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const brands = useMemo(() => ['Todos', ...Array.from(new Set(vehicles.map((item) => item.brand))).sort()], [vehicles]);
  const filtered = useMemo(() => {
    const q = normalize(query);
    return vehicles.filter((item) => (brand === 'Todos' || item.brand === brand) && (!q || item.searchText.includes(q)));
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
            query={query}
            refreshing={refreshing}
            setQuery={setQuery}
            total={vehicles.length}
          />
        ) : (
          <Contact />
        )}
        <Tabs active={tab} onChange={setTab} />
      </View>
    </SafeAreaView>
  );
}

async function fetchInventory() {
  const response = await fetch(STOCK_URL, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`Stock request failed: ${response.status}`);
  const html = await readText(response);
  const items = parseInventory(html);
  if (!items.length) throw new Error('No vehicles found');
  return items;
}

async function readText(response) {
  const type = response.headers?.get?.('content-type') || '';
  if (!type.toLowerCase().includes('iso-8859-1')) return response.text();
  const bytes = new Uint8Array(await response.arrayBuffer());
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return text;
}

function parseInventory(html) {
  const found = new Map();
  const regex = /<a\b[^>]*id=["']add-favorite-\d+["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const tag = match[0];
    const item = toVehicle([
      attr(tag, 'id'),
      attr(tag, 'description'),
      attr(tag, 'link'),
      attr(tag, 'imglink'),
      attr(tag, 'price'),
      attr(tag, 'year'),
      attr(tag, 'km'),
      attr(tag, 'fuel'),
    ]);
    if (item.id && !found.has(item.id)) found.set(item.id, item);
  }
  return Array.from(found.values());
}

function attr(tag, name) {
  const match = tag.match(new RegExp(`data-${name}=["']([^"']*)["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function toVehicle([id, title, path, image, price, year, km, fuel]) {
  const brand = brandFrom(path, title);
  const priceLabel = price ? `R$ ${price.replace(/,00$/, '')}` : 'Consultar';
  const kmLabel = !km || km === '0' ? '0 km' : `${km} km`;
  const type = String(path).includes('/motos/') ? 'Moto' : 'Carro';
  const link = absolute(path);
  return {
    id: String(id || ''),
    brand,
    fuel: String(fuel || '').toUpperCase(),
    image: absolute(image),
    kmLabel,
    link,
    priceLabel,
    searchText: normalize(`${title} ${brand} ${fuel} ${priceLabel} ${year}`),
    title: String(title || '').replace(/\s+/g, ' ').trim(),
    type,
    year,
  };
}

function brandFrom(path, title) {
  const brand = String(path || '').split('/').filter(Boolean)[1] || String(title || '').split(' ')[0] || '';
  return brand.replace(/-/g, ' ').toLowerCase().split(' ').filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
}

function absolute(value) {
  if (!value || /^https?:\/\//i.test(value)) return value || '';
  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

function decodeHtml(value) {
  const entities = { amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return String(value || '').replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (_, entity) => {
    if (entity[0] !== '#') return entities[entity] || '';
    const hex = entity[1].toLowerCase() === 'x';
    const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isNaN(code) ? '' : String.fromCodePoint(code);
  });
}

function Header({ loading, onRefresh }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <Image source={{ uri: LOGO_URL }} style={styles.logo} resizeMode="contain" />
        <Pressable onPress={onRefresh} style={styles.iconButton}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <MaterialCommunityIcons color="#fff" name="refresh" size={23} />}
        </Pressable>
      </View>
      <Text style={styles.kicker}>Curitiba - PR</Text>
      <Text style={styles.title}>Seminovos com atendimento direto</Text>
      <Text style={styles.subtitle}>Estoque online, anuncios oficiais e contato rapido com a equipe.</Text>
    </View>
  );
}

function Stock({ brand, brands, error, filtered, loading, onBrand, onRefresh, query, refreshing, setQuery, total }) {
  return (
    <View style={styles.content}>
      <View style={styles.searchPanel}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons color="#7a7d86" name="magnify" size={21} />
          <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={setQuery} placeholder="Buscar por marca ou modelo" placeholderTextColor="#7a7d86" style={styles.searchInput} value={query} />
        </View>
        <View style={styles.countRow}>
          <Text style={styles.count}>{filtered.length} encontrados</Text>
          <Text style={styles.muted}>{total} no app</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        {brands.map((item) => (
          <Pressable key={item} onPress={() => onBrand(item)} style={[styles.chip, brand === item && styles.chipActive]}>
            <Text style={[styles.chipText, brand === item && styles.chipTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <Text style={styles.notice}>{error}</Text> : null}
      <FlatList contentContainerStyle={styles.list} data={filtered} keyExtractor={(item) => item.id} refreshControl={<RefreshControl onRefresh={onRefresh} refreshing={refreshing} tintColor="#c41e3a" />} renderItem={({ item }) => <Vehicle item={item} />} ListEmptyComponent={loading ? <State text="Carregando estoque..." /> : <State icon="car-off" text="Nenhum veiculo encontrado." />} />
    </View>
  );
}

function Vehicle({ item }) {
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
          <Spec icon={item.type === 'Moto' ? 'motorbike' : 'car-hatchback'} text={item.type} />
        </View>
        <View style={styles.actions}>
          <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp(item)} />
          <Button icon="open-in-new" text="Anuncio" onPress={() => openUrl(item.link)} />
        </View>
      </View>
    </View>
  );
}

function Contact() {
  return (
    <ScrollView contentContainerStyle={styles.contact}>
      <Text style={styles.sectionTitle}>Atendimento Squ4ttro Motors</Text>
      <Text style={styles.sectionText}>Escolha uma unidade ou fale agora pelo WhatsApp principal.</Text>
      <View style={styles.actions}>
        <Button icon="whatsapp" text="WhatsApp" tone="whatsapp" onPress={() => openWhatsapp()} />
        <Button icon="web" text="Site" onPress={() => openUrl(SITE_URL)} />
      </View>
      {CONTACTS.map((store) => (
        <View key={store.name} style={styles.store}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Info icon="map-marker" text={store.address} />
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
  const items = [['stock', 'car-search', 'Estoque'], ['contact', 'phone-message', 'Contato']];
  return <View style={styles.tabs}>{items.map(([key, icon, label]) => <Pressable key={key} onPress={() => onChange(key)} style={[styles.tab, active === key && styles.tabActive]}><MaterialCommunityIcons color={active === key ? '#fff' : '#747883'} name={icon} size={22} /><Text style={[styles.tabText, active === key && styles.tabTextActive]}>{label}</Text></Pressable>)}</View>;
}

function Spec({ icon, text }) {
  return <View style={styles.spec}><MaterialCommunityIcons color="#747883" name={icon} size={16} /><Text numberOfLines={1} style={styles.specText}>{text}</Text></View>;
}

function Info({ icon, text }) {
  return <View style={styles.info}><MaterialCommunityIcons color="#747883" name={icon} size={18} /><Text style={styles.storeInfo}>{text}</Text></View>;
}

function Button({ icon, onPress, text, tone = 'dark' }) {
  return <Pressable onPress={onPress} style={[styles.button, tone === 'whatsapp' && styles.whatsapp, tone === 'light' && styles.light]}><MaterialCommunityIcons color={tone === 'light' ? '#17181c' : '#fff'} name={icon} size={18} /><Text style={[styles.buttonText, tone === 'light' && styles.darkText]}>{text}</Text></Pressable>;
}

function State({ icon = 'loading', text }) {
  return <View style={styles.state}>{icon === 'loading' ? <ActivityIndicator color="#c41e3a" size="large" /> : <MaterialCommunityIcons color="#9ca0aa" name={icon} size={40} />}<Text style={styles.mutedStrong}>{text}</Text></View>;
}

function openWhatsapp(vehicle, phone = '5541984606278') {
  const message = vehicle ? `Ola, vi o anuncio do ${vehicle.title} (${vehicle.priceLabel}) no app da Squ4ttro Motors e gostaria de saber mais. ${vehicle.link}` : 'Ola, vim pelo app da Squ4ttro Motors e gostaria de atendimento.';
  openUrl(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}
function openMap(address) { openUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`); }
function openUrl(url) { Linking.openURL(url).catch(() => {}); }
function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#101115' },
  shell: { flex: 1, backgroundColor: '#f4f5f7' },
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
  chips: { backgroundColor: '#fff', flexGrow: 0, paddingHorizontal: 14, paddingVertical: 12 },
  chip: { backgroundColor: '#f0f1f4', borderRadius: 8, marginHorizontal: 4, paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: '#c41e3a' },
  chipText: { color: '#424550', fontSize: 13, fontWeight: '800' },
  chipTextActive: { color: '#fff' },
  notice: { backgroundColor: '#fff3f5', color: '#7c1c2e', fontSize: 12, fontWeight: '700', padding: 12, paddingHorizontal: 18 },
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
