const { XMLParser } = require('fast-xml-parser');

const SITE_URL = 'https://squ4ttromotors.com.br';
const REVENDAMAIS_FEED_URL =
  'http://app.revendamais.com.br/application/index.php/apiGeneratorXml/generator/sitedaloja/4e24bb8b9bfec5a702ee95ca0d7b84987561.xml';

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

const FALLBACK_ADS = [
  {
    ID: '8073368',
    TITLE: 'renault duster tech road 2.0 16v aut 2014',
    CATEGORY: 'carro',
    MAKE: 'renault',
    MODEL: 'duster tech road 2.0 16v aut',
    YEAR: '2014',
    FABRIC_YEAR: '2013',
    MILEAGE: '132365',
    FUEL: 'flex',
    GEAR: 'automatico',
    MOTOR: '2.0',
    DOORS: '4',
    COLOR: 'preto',
    PRICE: '59800.00',
    SELLER: 's4 - auto shopping',
    PHONE: '41 30102019',
    STREET: 'rodovia br-116',
    NUMBER: '7534',
    NEIGHBORHOOD: 'taruma',
    LOCATION_CITY: 'curitiba',
    LOCATION_STATE: 'parana',
    IMAGES_LARGE: {
      IMAGE_URL_LARGE: 'https://s3.carro57.com.br/FC/7561/8073368_21_W_2a2c49b508.jpeg',
    },
  },
  {
    ID: '8021729',
    TITLE: 'nissan march 10 flex 2014',
    CATEGORY: 'carro',
    MAKE: 'nissan',
    MODEL: 'march 10 flex',
    YEAR: '2014',
    FABRIC_YEAR: '2013',
    MILEAGE: '140000',
    FUEL: 'flex',
    GEAR: 'manual',
    MOTOR: '1.0',
    DOORS: '4',
    COLOR: 'cinza',
    PRICE: '35800.00',
    SELLER: 's4 - auto shopping',
    PHONE: '41 30102019',
    STREET: 'rodovia br-116',
    NUMBER: '7534',
    NEIGHBORHOOD: 'taruma',
    LOCATION_CITY: 'curitiba',
    LOCATION_STATE: 'parana',
    IMAGES_LARGE: {
      IMAGE_URL_LARGE: 'https://s3.carro57.com.br/FC/7561/8021729_21_W_b53b224041.jpeg',
    },
  },
  {
    ID: '6261192',
    TITLE: 'hyundai i30 2.0 2011',
    CATEGORY: 'carro',
    MAKE: 'hyundai',
    MODEL: 'i30 2.0',
    YEAR: '2011',
    FABRIC_YEAR: '2010',
    MILEAGE: '199000',
    FUEL: 'gasolina',
    GEAR: 'manual',
    MOTOR: '2.0',
    DOORS: '4',
    COLOR: 'preto',
    PRICE: '41800.00',
    SELLER: 's4 - loja hauer',
    PHONE: '41 30102019',
    STREET: 'rua anne frank',
    NUMBER: '2096',
    NEIGHBORHOOD: 'boqueirao',
    LOCATION_CITY: 'curitiba',
    LOCATION_STATE: 'parana',
    IMAGES_LARGE: {
      IMAGE_URL_LARGE: 'https://s3.carro57.com.br/FC/7561/6261192_1_W_658377a299.jpeg',
    },
  },
];

const FALLBACK_VEHICLES = FALLBACK_ADS.map(normalizeAd);

const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  trimValues: true,
});

async function fetchInventory() {
  const response = await fetch(REVENDAMAIS_FEED_URL, {
    headers: {
      Accept: 'application/xml,text/xml,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Revenda Mais request failed: ${response.status}`);
  }

  const xml = await response.text();
  const vehicles = parseRevendaMaisFeed(xml);

  if (!vehicles.length) {
    throw new Error('No vehicles found in Revenda Mais feed');
  }

  return vehicles;
}

function parseRevendaMaisFeed(xml) {
  const parsed = parser.parse(xml);
  const ads = asArray(parsed && parsed.ADS && parsed.ADS.AD);

  return ads.map(normalizeAd).filter((item) => item.id && item.title);
}

function normalizeAd(ad) {
  const id = text(ad.ID);
  const make = titleCase(ad.MAKE);
  const model = titleCase(ad.MODEL);
  const title = titleCase(ad.TITLE || `${make} ${model}`.trim());
  const category = titleCase(ad.CATEGORY || 'carro');
  const type = category.toLowerCase().includes('moto') ? 'Moto' : 'Carro';
  const fuel = titleCase(ad.FUEL);
  const gear = titleCase(ad.GEAR);
  const color = titleCase(ad.COLOR);
  const seller = formatSeller(ad.SELLER);
  const phone = formatPhone(ad.PHONE);
  const phoneLink = phoneToLink(ad.PHONE);
  const whatsapp = whatsappForSeller(ad.SELLER);
  const accessories = splitList(ad.ACCESSORIES);
  const images = unique([
    ...asArray(ad.IMAGES_LARGE && ad.IMAGES_LARGE.IMAGE_URL_LARGE),
    ...asArray(ad.IMAGES && ad.IMAGES.IMAGE_URL),
  ]);
  const address = formatAddress(ad);
  const year = formatYear(ad.FABRIC_YEAR, ad.YEAR);
  const priceLabel = formatPrice(ad.PROMOTION_PRICE && Number(ad.PROMOTION_PRICE) > 0 ? ad.PROMOTION_PRICE : ad.PRICE);
  const kmLabel = formatKm(ad.MILEAGE);
  const description = normalizeSpaces(ad.DESCRIPTION);

  return {
    id,
    accessories,
    address,
    brand: make,
    color,
    description,
    doors: text(ad.DOORS),
    fuel,
    gear,
    image: images[0] || '',
    images,
    kmLabel,
    link: SITE_URL,
    model,
    motor: text(ad.MOTOR),
    phone,
    phoneLink,
    priceLabel,
    searchText: normalize(`${title} ${make} ${model} ${fuel} ${gear} ${seller} ${priceLabel} ${year}`),
    seller,
    title,
    type,
    whatsapp,
    year,
  };
}

function splitList(value) {
  return text(value)
    .split(',')
    .map((item) => titleCase(item))
    .filter(Boolean);
}

function formatAddress(ad) {
  const parts = [ad.STREET, ad.NUMBER, ad.NEIGHBORHOOD, ad.LOCATION_CITY]
    .map(titleCase)
    .filter(Boolean);
  const state = titleCase(ad.LOCATION_STATE);
  return state ? `${parts.join(', ')} - ${state}` : parts.join(', ');
}

function formatYear(fabricYear, modelYear) {
  const fabric = text(fabricYear);
  const model = text(modelYear);
  if (fabric && model && fabric !== model) {
    return `${fabric}/${model}`;
  }
  return model || fabric || 'Ano sob consulta';
}

function formatPrice(value) {
  const price = Number(String(value || '').replace(',', '.'));
  if (!Number.isFinite(price) || price <= 0) {
    return 'Consultar';
  }
  return price.toLocaleString('pt-BR', {
    currency: 'BRL',
    maximumFractionDigits: 0,
    style: 'currency',
  });
}

function formatKm(value) {
  const km = Number(String(value || '').replace(/\D/g, ''));
  if (!Number.isFinite(km) || km <= 0) {
    return '0 km';
  }
  return `${km.toLocaleString('pt-BR')} km`;
}

function formatPhone(value) {
  const digits = text(value).replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return text(value) || '(41) 3010-2019';
}

function phoneToLink(value) {
  const digits = text(value).replace(/\D/g, '');
  return digits ? `+55${digits}` : '+554130102019';
}

function whatsappForSeller(value) {
  const seller = normalize(value);
  if (seller.includes('auto shopping') || seller.includes('shopping')) {
    return '5541992860989';
  }
  return '5541984606278';
}

function formatSeller(value) {
  const seller = text(value).toLowerCase();
  if (seller.includes('auto shopping')) {
    return 'S4 - Auto Shopping';
  }
  if (seller.includes('loja hauer')) {
    return 'S4 - Loja Hauer';
  }
  return titleCase(value);
}

function titleCase(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (/^(s4|4x2|4x4|awd|abs|cv|gts|hdi|ltz|suv)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function normalizeSpaces(value) {
  return text(value).replace(/\s+/g, ' ').trim();
}

function asArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function unique(values) {
  return Array.from(new Set(values.map(text).filter(Boolean)));
}

function text(value) {
  return value == null ? '' : String(value);
}

function normalize(value) {
  return text(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

module.exports = {
  CONTACTS,
  FALLBACK_VEHICLES,
  REVENDAMAIS_FEED_URL,
  SITE_URL,
  fetchInventory,
  parseRevendaMaisFeed,
};
