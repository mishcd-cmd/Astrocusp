import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Platform,
  Keyboard,
  FlatList,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Check } from 'lucide-react-native';

type Suggestion = {
  id: string;
  city: string;
  country: string;
  label: string; // e.g. "Sydney, Australia"
};

interface LocationInputProps {
  label?: string;
  value: string;
  placeholder?: string;
  onLocationChange: (v: string) => void;
  minChars?: number;
}

// Comprehensive cities database for suggestions
const MAJOR_CITIES = [
  // Australia
  { id: 'sydney-au', city: 'Sydney', country: 'Australia', label: 'Sydney, Australia' },
  { id: 'melbourne-au', city: 'Melbourne', country: 'Australia', label: 'Melbourne, Australia' },
  { id: 'brisbane-au', city: 'Brisbane', country: 'Australia', label: 'Brisbane, Australia' },
  { id: 'perth-au', city: 'Perth', country: 'Australia', label: 'Perth, Australia' },
  { id: 'adelaide-au', city: 'Adelaide', country: 'Australia', label: 'Adelaide, Australia' },
  { id: 'canberra-au', city: 'Canberra', country: 'Australia', label: 'Canberra, Australia' },
  { id: 'darwin-au', city: 'Darwin', country: 'Australia', label: 'Darwin, Australia' },
  { id: 'hobart-au', city: 'Hobart', country: 'Australia', label: 'Hobart, Australia' },
  { id: 'gold-coast-au', city: 'Gold Coast', country: 'Australia', label: 'Gold Coast, Australia' },
  { id: 'newcastle-au', city: 'Newcastle', country: 'Australia', label: 'Newcastle, Australia' },
  { id: 'wollongong-au', city: 'Wollongong', country: 'Australia', label: 'Wollongong, Australia' },
  { id: 'geelong-au', city: 'Geelong', country: 'Australia', label: 'Geelong, Australia' },
  { id: 'townsville-au', city: 'Townsville', country: 'Australia', label: 'Townsville, Australia' },
  { id: 'cairns-au', city: 'Cairns', country: 'Australia', label: 'Cairns, Australia' },
  
  // United States
  { id: 'new-york-us', city: 'New York', country: 'United States', label: 'New York, United States' },
  { id: 'los-angeles-us', city: 'Los Angeles', country: 'United States', label: 'Los Angeles, United States' },
  { id: 'chicago-us', city: 'Chicago', country: 'United States', label: 'Chicago, United States' },
  { id: 'houston-us', city: 'Houston', country: 'United States', label: 'Houston, United States' },
  { id: 'phoenix-us', city: 'Phoenix', country: 'United States', label: 'Phoenix, United States' },
  { id: 'philadelphia-us', city: 'Philadelphia', country: 'United States', label: 'Philadelphia, United States' },
  { id: 'san-antonio-us', city: 'San Antonio', country: 'United States', label: 'San Antonio, United States' },
  { id: 'san-diego-us', city: 'San Diego', country: 'United States', label: 'San Diego, United States' },
  { id: 'dallas-us', city: 'Dallas', country: 'United States', label: 'Dallas, United States' },
  { id: 'austin-us', city: 'Austin', country: 'United States', label: 'Austin, United States' },
  { id: 'san-francisco-us', city: 'San Francisco', country: 'United States', label: 'San Francisco, United States' },
  { id: 'seattle-us', city: 'Seattle', country: 'United States', label: 'Seattle, United States' },
  { id: 'denver-us', city: 'Denver', country: 'United States', label: 'Denver, United States' },
  { id: 'washington-us', city: 'Washington DC', country: 'United States', label: 'Washington DC, United States' },
  { id: 'boston-us', city: 'Boston', country: 'United States', label: 'Boston, United States' },
  { id: 'las-vegas-us', city: 'Las Vegas', country: 'United States', label: 'Las Vegas, United States' },
  { id: 'miami-us', city: 'Miami', country: 'United States', label: 'Miami, United States' },
  { id: 'atlanta-us', city: 'Atlanta', country: 'United States', label: 'Atlanta, United States' },
  
  // United Kingdom
  { id: 'london-uk', city: 'London', country: 'United Kingdom', label: 'London, United Kingdom' },
  { id: 'manchester-uk', city: 'Manchester', country: 'United Kingdom', label: 'Manchester, United Kingdom' },
  { id: 'birmingham-uk', city: 'Birmingham', country: 'United Kingdom', label: 'Birmingham, United Kingdom' },
  { id: 'glasgow-uk', city: 'Glasgow', country: 'United Kingdom', label: 'Glasgow, United Kingdom' },
  { id: 'liverpool-uk', city: 'Liverpool', country: 'United Kingdom', label: 'Liverpool, United Kingdom' },
  { id: 'edinburgh-uk', city: 'Edinburgh', country: 'United Kingdom', label: 'Edinburgh, United Kingdom' },
  { id: 'leeds-uk', city: 'Leeds', country: 'United Kingdom', label: 'Leeds, United Kingdom' },
  { id: 'sheffield-uk', city: 'Sheffield', country: 'United Kingdom', label: 'Sheffield, United Kingdom' },
  { id: 'bristol-uk', city: 'Bristol', country: 'United Kingdom', label: 'Bristol, United Kingdom' },
  { id: 'cardiff-uk', city: 'Cardiff', country: 'United Kingdom', label: 'Cardiff, United Kingdom' },
  { id: 'belfast-uk', city: 'Belfast', country: 'United Kingdom', label: 'Belfast, United Kingdom' },
  
  // Canada
  { id: 'toronto-ca', city: 'Toronto', country: 'Canada', label: 'Toronto, Canada' },
  { id: 'vancouver-ca', city: 'Vancouver', country: 'Canada', label: 'Vancouver, Canada' },
  { id: 'montreal-ca', city: 'Montreal', country: 'Canada', label: 'Montreal, Canada' },
  { id: 'calgary-ca', city: 'Calgary', country: 'Canada', label: 'Calgary, Canada' },
  { id: 'ottawa-ca', city: 'Ottawa', country: 'Canada', label: 'Ottawa, Canada' },
  { id: 'edmonton-ca', city: 'Edmonton', country: 'Canada', label: 'Edmonton, Canada' },
  { id: 'winnipeg-ca', city: 'Winnipeg', country: 'Canada', label: 'Winnipeg, Canada' },
  { id: 'quebec-city-ca', city: 'Quebec City', country: 'Canada', label: 'Quebec City, Canada' },
  { id: 'hamilton-ca', city: 'Hamilton', country: 'Canada', label: 'Hamilton, Canada' },
  
  // New Zealand
  { id: 'auckland-nz', city: 'Auckland', country: 'New Zealand', label: 'Auckland, New Zealand' },
  { id: 'wellington-nz', city: 'Wellington', country: 'New Zealand', label: 'Wellington, New Zealand' },
  { id: 'christchurch-nz', city: 'Christchurch', country: 'New Zealand', label: 'Christchurch, New Zealand' },
  { id: 'hamilton-nz', city: 'Hamilton', country: 'New Zealand', label: 'Hamilton, New Zealand' },
  { id: 'tauranga-nz', city: 'Tauranga', country: 'New Zealand', label: 'Tauranga, New Zealand' },
  { id: 'dunedin-nz', city: 'Dunedin', country: 'New Zealand', label: 'Dunedin, New Zealand' },
  
  // South Africa
  { id: 'cape-town-za', city: 'Cape Town', country: 'South Africa', label: 'Cape Town, South Africa' },
  { id: 'johannesburg-za', city: 'Johannesburg', country: 'South Africa', label: 'Johannesburg, South Africa' },
  { id: 'durban-za', city: 'Durban', country: 'South Africa', label: 'Durban, South Africa' },
  { id: 'pretoria-za', city: 'Pretoria', country: 'South Africa', label: 'Pretoria, South Africa' },
  { id: 'port-elizabeth-za', city: 'Port Elizabeth', country: 'South Africa', label: 'Port Elizabeth, South Africa' },
  { id: 'bloemfontein-za', city: 'Bloemfontein', country: 'South Africa', label: 'Bloemfontein, South Africa' },
  
  // Philippines
  { id: 'manila-ph', city: 'Manila', country: 'Philippines', label: 'Manila, Philippines' },
  { id: 'quezon-city-ph', city: 'Quezon City', country: 'Philippines', label: 'Quezon City, Philippines' },
  { id: 'davao-ph', city: 'Davao', country: 'Philippines', label: 'Davao, Philippines' },
  { id: 'caloocan-ph', city: 'Caloocan', country: 'Philippines', label: 'Caloocan, Philippines' },
  { id: 'cebu-city-ph', city: 'Cebu City', country: 'Philippines', label: 'Cebu City, Philippines' },
  { id: 'zamboanga-ph', city: 'Zamboanga', country: 'Philippines', label: 'Zamboanga, Philippines' },
  { id: 'antipolo-ph', city: 'Antipolo', country: 'Philippines', label: 'Antipolo, Philippines' },
  { id: 'pasig-ph', city: 'Pasig', country: 'Philippines', label: 'Pasig, Philippines' },
  { id: 'taguig-ph', city: 'Taguig', country: 'Philippines', label: 'Taguig, Philippines' },
  { id: 'makati-ph', city: 'Makati', country: 'Philippines', label: 'Makati, Philippines' },
  
  // Indonesia
  { id: 'jakarta-id', city: 'Jakarta', country: 'Indonesia', label: 'Jakarta, Indonesia' },
  { id: 'surabaya-id', city: 'Surabaya', country: 'Indonesia', label: 'Surabaya, Indonesia' },
  { id: 'bandung-id', city: 'Bandung', country: 'Indonesia', label: 'Bandung, Indonesia' },
  { id: 'medan-id', city: 'Medan', country: 'Indonesia', label: 'Medan, Indonesia' },
  { id: 'semarang-id', city: 'Semarang', country: 'Indonesia', label: 'Semarang, Indonesia' },
  { id: 'makassar-id', city: 'Makassar', country: 'Indonesia', label: 'Makassar, Indonesia' },
  { id: 'palembang-id', city: 'Palembang', country: 'Indonesia', label: 'Palembang, Indonesia' },
  
  // Thailand
  { id: 'bangkok-th', city: 'Bangkok', country: 'Thailand', label: 'Bangkok, Thailand' },
  { id: 'chiang-mai-th', city: 'Chiang Mai', country: 'Thailand', label: 'Chiang Mai, Thailand' },
  { id: 'phuket-th', city: 'Phuket', country: 'Thailand', label: 'Phuket, Thailand' },
  { id: 'pattaya-th', city: 'Pattaya', country: 'Thailand', label: 'Pattaya, Thailand' },
  { id: 'hat-yai-th', city: 'Hat Yai', country: 'Thailand', label: 'Hat Yai, Thailand' },
  
  // Malaysia
  { id: 'kuala-lumpur-my', city: 'Kuala Lumpur', country: 'Malaysia', label: 'Kuala Lumpur, Malaysia' },
  { id: 'george-town-my', city: 'George Town', country: 'Malaysia', label: 'George Town, Malaysia' },
  { id: 'ipoh-my', city: 'Ipoh', country: 'Malaysia', label: 'Ipoh, Malaysia' },
  { id: 'shah-alam-my', city: 'Shah Alam', country: 'Malaysia', label: 'Shah Alam, Malaysia' },
  { id: 'petaling-jaya-my', city: 'Petaling Jaya', country: 'Malaysia', label: 'Petaling Jaya, Malaysia' },
  { id: 'johor-bahru-my', city: 'Johor Bahru', country: 'Malaysia', label: 'Johor Bahru, Malaysia' },
  
  // Singapore
  { id: 'singapore-sg', city: 'Singapore', country: 'Singapore', label: 'Singapore, Singapore' },
  
  // Vietnam
  { id: 'ho-chi-minh-vn', city: 'Ho Chi Minh City', country: 'Vietnam', label: 'Ho Chi Minh City, Vietnam' },
  { id: 'hanoi-vn', city: 'Hanoi', country: 'Vietnam', label: 'Hanoi, Vietnam' },
  { id: 'da-nang-vn', city: 'Da Nang', country: 'Vietnam', label: 'Da Nang, Vietnam' },
  { id: 'can-tho-vn', city: 'Can Tho', country: 'Vietnam', label: 'Can Tho, Vietnam' },
  { id: 'hai-phong-vn', city: 'Hai Phong', country: 'Vietnam', label: 'Hai Phong, Vietnam' },
  
  // Croatia
  { id: 'zagreb-hr', city: 'Zagreb', country: 'Croatia', label: 'Zagreb, Croatia' },
  { id: 'split-hr', city: 'Split', country: 'Croatia', label: 'Split, Croatia' },
  { id: 'rijeka-hr', city: 'Rijeka', country: 'Croatia', label: 'Rijeka, Croatia' },
  { id: 'dubrovnik-hr', city: 'Dubrovnik', country: 'Croatia', label: 'Dubrovnik, Croatia' },
  { id: 'osijek-hr', city: 'Osijek', country: 'Croatia', label: 'Osijek, Croatia' },
  { id: 'zadar-hr', city: 'Zadar', country: 'Croatia', label: 'Zadar, Croatia' },
  { id: 'pula-hr', city: 'Pula', country: 'Croatia', label: 'Pula, Croatia' },
  
  // France
  { id: 'paris-fr', city: 'Paris', country: 'France', label: 'Paris, France' },
  { id: 'marseille-fr', city: 'Marseille', country: 'France', label: 'Marseille, France' },
  { id: 'lyon-fr', city: 'Lyon', country: 'France', label: 'Lyon, France' },
  { id: 'toulouse-fr', city: 'Toulouse', country: 'France', label: 'Toulouse, France' },
  { id: 'nice-fr', city: 'Nice', country: 'France', label: 'Nice, France' },
  { id: 'nantes-fr', city: 'Nantes', country: 'France', label: 'Nantes, France' },
  { id: 'strasbourg-fr', city: 'Strasbourg', country: 'France', label: 'Strasbourg, France' },
  { id: 'montpellier-fr', city: 'Montpellier', country: 'France', label: 'Montpellier, France' },
  { id: 'bordeaux-fr', city: 'Bordeaux', country: 'France', label: 'Bordeaux, France' },
  { id: 'lille-fr', city: 'Lille', country: 'France', label: 'Lille, France' },
  
  // Germany
  { id: 'berlin-de', city: 'Berlin', country: 'Germany', label: 'Berlin, Germany' },
  { id: 'hamburg-de', city: 'Hamburg', country: 'Germany', label: 'Hamburg, Germany' },
  { id: 'munich-de', city: 'Munich', country: 'Germany', label: 'Munich, Germany' },
  { id: 'cologne-de', city: 'Cologne', country: 'Germany', label: 'Cologne, Germany' },
  { id: 'frankfurt-de', city: 'Frankfurt', country: 'Germany', label: 'Frankfurt, Germany' },
  { id: 'stuttgart-de', city: 'Stuttgart', country: 'Germany', label: 'Stuttgart, Germany' },
  { id: 'dusseldorf-de', city: 'Düsseldorf', country: 'Germany', label: 'Düsseldorf, Germany' },
  { id: 'dortmund-de', city: 'Dortmund', country: 'Germany', label: 'Dortmund, Germany' },
  { id: 'essen-de', city: 'Essen', country: 'Germany', label: 'Essen, Germany' },
  { id: 'leipzig-de', city: 'Leipzig', country: 'Germany', label: 'Leipzig, Germany' },
  
  // Italy
  { id: 'rome-it', city: 'Rome', country: 'Italy', label: 'Rome, Italy' },
  { id: 'milan-it', city: 'Milan', country: 'Italy', label: 'Milan, Italy' },
  { id: 'naples-it', city: 'Naples', country: 'Italy', label: 'Naples, Italy' },
  { id: 'florence-it', city: 'Florence', country: 'Italy', label: 'Florence, Italy' },
  { id: 'turin-it', city: 'Turin', country: 'Italy', label: 'Turin, Italy' },
  { id: 'palermo-it', city: 'Palermo', country: 'Italy', label: 'Palermo, Italy' },
  { id: 'genoa-it', city: 'Genoa', country: 'Italy', label: 'Genoa, Italy' },
  { id: 'bologna-it', city: 'Bologna', country: 'Italy', label: 'Bologna, Italy' },
  { id: 'bari-it', city: 'Bari', country: 'Italy', label: 'Bari, Italy' },
  { id: 'catania-it', city: 'Catania', country: 'Italy', label: 'Catania, Italy' },
  
  // Spain
  { id: 'madrid-es', city: 'Madrid', country: 'Spain', label: 'Madrid, Spain' },
  { id: 'barcelona-es', city: 'Barcelona', country: 'Spain', label: 'Barcelona, Spain' },
  { id: 'valencia-es', city: 'Valencia', country: 'Spain', label: 'Valencia, Spain' },
  { id: 'seville-es', city: 'Seville', country: 'Spain', label: 'Seville, Spain' },
  { id: 'zaragoza-es', city: 'Zaragoza', country: 'Spain', label: 'Zaragoza, Spain' },
  { id: 'malaga-es', city: 'Málaga', country: 'Spain', label: 'Málaga, Spain' },
  { id: 'murcia-es', city: 'Murcia', country: 'Spain', label: 'Murcia, Spain' },
  { id: 'palma-es', city: 'Palma', country: 'Spain', label: 'Palma, Spain' },
  { id: 'las-palmas-es', city: 'Las Palmas', country: 'Spain', label: 'Las Palmas, Spain' },
  { id: 'bilbao-es', city: 'Bilbao', country: 'Spain', label: 'Bilbao, Spain' },
  
  // Netherlands
  { id: 'amsterdam-nl', city: 'Amsterdam', country: 'Netherlands', label: 'Amsterdam, Netherlands' },
  { id: 'rotterdam-nl', city: 'Rotterdam', country: 'Netherlands', label: 'Rotterdam, Netherlands' },
  { id: 'the-hague-nl', city: 'The Hague', country: 'Netherlands', label: 'The Hague, Netherlands' },
  { id: 'utrecht-nl', city: 'Utrecht', country: 'Netherlands', label: 'Utrecht, Netherlands' },
  { id: 'eindhoven-nl', city: 'Eindhoven', country: 'Netherlands', label: 'Eindhoven, Netherlands' },
  { id: 'tilburg-nl', city: 'Tilburg', country: 'Netherlands', label: 'Tilburg, Netherlands' },
  { id: 'groningen-nl', city: 'Groningen', country: 'Netherlands', label: 'Groningen, Netherlands' },
  
  // Belgium
  { id: 'brussels-be', city: 'Brussels', country: 'Belgium', label: 'Brussels, Belgium' },
  { id: 'antwerp-be', city: 'Antwerp', country: 'Belgium', label: 'Antwerp, Belgium' },
  { id: 'ghent-be', city: 'Ghent', country: 'Belgium', label: 'Ghent, Belgium' },
  { id: 'charleroi-be', city: 'Charleroi', country: 'Belgium', label: 'Charleroi, Belgium' },
  { id: 'liege-be', city: 'Liège', country: 'Belgium', label: 'Liège, Belgium' },
  { id: 'bruges-be', city: 'Bruges', country: 'Belgium', label: 'Bruges, Belgium' },
  
  // Switzerland
  { id: 'zurich-ch', city: 'Zurich', country: 'Switzerland', label: 'Zurich, Switzerland' },
  { id: 'geneva-ch', city: 'Geneva', country: 'Switzerland', label: 'Geneva, Switzerland' },
  { id: 'basel-ch', city: 'Basel', country: 'Switzerland', label: 'Basel, Switzerland' },
  { id: 'bern-ch', city: 'Bern', country: 'Switzerland', label: 'Bern, Switzerland' },
  { id: 'lausanne-ch', city: 'Lausanne', country: 'Switzerland', label: 'Lausanne, Switzerland' },
  
  // Austria
  { id: 'vienna-at', city: 'Vienna', country: 'Austria', label: 'Vienna, Austria' },
  { id: 'graz-at', city: 'Graz', country: 'Austria', label: 'Graz, Austria' },
  { id: 'linz-at', city: 'Linz', country: 'Austria', label: 'Linz, Austria' },
  { id: 'salzburg-at', city: 'Salzburg', country: 'Austria', label: 'Salzburg, Austria' },
  { id: 'innsbruck-at', city: 'Innsbruck', country: 'Austria', label: 'Innsbruck, Austria' },
  
  // Japan
  { id: 'tokyo-jp', city: 'Tokyo', country: 'Japan', label: 'Tokyo, Japan' },
  { id: 'osaka-jp', city: 'Osaka', country: 'Japan', label: 'Osaka, Japan' },
  { id: 'kyoto-jp', city: 'Kyoto', country: 'Japan', label: 'Kyoto, Japan' },
  { id: 'yokohama-jp', city: 'Yokohama', country: 'Japan', label: 'Yokohama, Japan' },
  { id: 'nagoya-jp', city: 'Nagoya', country: 'Japan', label: 'Nagoya, Japan' },
  { id: 'sapporo-jp', city: 'Sapporo', country: 'Japan', label: 'Sapporo, Japan' },
  { id: 'kobe-jp', city: 'Kobe', country: 'Japan', label: 'Kobe, Japan' },
  { id: 'fukuoka-jp', city: 'Fukuoka', country: 'Japan', label: 'Fukuoka, Japan' },
  { id: 'hiroshima-jp', city: 'Hiroshima', country: 'Japan', label: 'Hiroshima, Japan' },
  { id: 'sendai-jp', city: 'Sendai', country: 'Japan', label: 'Sendai, Japan' },
  
  // South Korea
  { id: 'seoul-kr', city: 'Seoul', country: 'South Korea', label: 'Seoul, South Korea' },
  { id: 'busan-kr', city: 'Busan', country: 'South Korea', label: 'Busan, South Korea' },
  { id: 'incheon-kr', city: 'Incheon', country: 'South Korea', label: 'Incheon, South Korea' },
  { id: 'daegu-kr', city: 'Daegu', country: 'South Korea', label: 'Daegu, South Korea' },
  { id: 'daejeon-kr', city: 'Daejeon', country: 'South Korea', label: 'Daejeon, South Korea' },
  { id: 'gwangju-kr', city: 'Gwangju', country: 'South Korea', label: 'Gwangju, South Korea' },
  
  // China
  { id: 'beijing-cn', city: 'Beijing', country: 'China', label: 'Beijing, China' },
  { id: 'shanghai-cn', city: 'Shanghai', country: 'China', label: 'Shanghai, China' },
  { id: 'guangzhou-cn', city: 'Guangzhou', country: 'China', label: 'Guangzhou, China' },
  { id: 'shenzhen-cn', city: 'Shenzhen', country: 'China', label: 'Shenzhen, China' },
  { id: 'tianjin-cn', city: 'Tianjin', country: 'China', label: 'Tianjin, China' },
  { id: 'wuhan-cn', city: 'Wuhan', country: 'China', label: 'Wuhan, China' },
  { id: 'dongguan-cn', city: 'Dongguan', country: 'China', label: 'Dongguan, China' },
  { id: 'chengdu-cn', city: 'Chengdu', country: 'China', label: 'Chengdu, China' },
  { id: 'nanjing-cn', city: 'Nanjing', country: 'China', label: 'Nanjing, China' },
  { id: 'chongqing-cn', city: 'Chongqing', country: 'China', label: 'Chongqing, China' },
  { id: 'xian-cn', city: 'Xi\'an', country: 'China', label: 'Xi\'an, China' },
  { id: 'hangzhou-cn', city: 'Hangzhou', country: 'China', label: 'Hangzhou, China' },
  
  // India
  { id: 'mumbai-in', city: 'Mumbai', country: 'India', label: 'Mumbai, India' },
  { id: 'delhi-in', city: 'Delhi', country: 'India', label: 'Delhi, India' },
  { id: 'bangalore-in', city: 'Bangalore', country: 'India', label: 'Bangalore, India' },
  { id: 'hyderabad-in', city: 'Hyderabad', country: 'India', label: 'Hyderabad, India' },
  { id: 'ahmedabad-in', city: 'Ahmedabad', country: 'India', label: 'Ahmedabad, India' },
  { id: 'chennai-in', city: 'Chennai', country: 'India', label: 'Chennai, India' },
  { id: 'kolkata-in', city: 'Kolkata', country: 'India', label: 'Kolkata, India' },
  { id: 'surat-in', city: 'Surat', country: 'India', label: 'Surat, India' },
  { id: 'pune-in', city: 'Pune', country: 'India', label: 'Pune, India' },
  { id: 'jaipur-in', city: 'Jaipur', country: 'India', label: 'Jaipur, India' },
  { id: 'lucknow-in', city: 'Lucknow', country: 'India', label: 'Lucknow, India' },
  { id: 'kanpur-in', city: 'Kanpur', country: 'India', label: 'Kanpur, India' },
  
  // Brazil
  { id: 'sao-paulo-br', city: 'São Paulo', country: 'Brazil', label: 'São Paulo, Brazil' },
  { id: 'rio-de-janeiro-br', city: 'Rio de Janeiro', country: 'Brazil', label: 'Rio de Janeiro, Brazil' },
  { id: 'brasilia-br', city: 'Brasília', country: 'Brazil', label: 'Brasília, Brazil' },
  { id: 'salvador-br', city: 'Salvador', country: 'Brazil', label: 'Salvador, Brazil' },
  { id: 'fortaleza-br', city: 'Fortaleza', country: 'Brazil', label: 'Fortaleza, Brazil' },
  { id: 'belo-horizonte-br', city: 'Belo Horizonte', country: 'Brazil', label: 'Belo Horizonte, Brazil' },
  { id: 'manaus-br', city: 'Manaus', country: 'Brazil', label: 'Manaus, Brazil' },
  { id: 'curitiba-br', city: 'Curitiba', country: 'Brazil', label: 'Curitiba, Brazil' },
  { id: 'recife-br', city: 'Recife', country: 'Brazil', label: 'Recife, Brazil' },
  { id: 'porto-alegre-br', city: 'Porto Alegre', country: 'Brazil', label: 'Porto Alegre, Brazil' },
  
  // Argentina
  { id: 'buenos-aires-ar', city: 'Buenos Aires', country: 'Argentina', label: 'Buenos Aires, Argentina' },
  { id: 'cordoba-ar', city: 'Córdoba', country: 'Argentina', label: 'Córdoba, Argentina' },
  { id: 'rosario-ar', city: 'Rosario', country: 'Argentina', label: 'Rosario, Argentina' },
  { id: 'mendoza-ar', city: 'Mendoza', country: 'Argentina', label: 'Mendoza, Argentina' },
  { id: 'tucuman-ar', city: 'Tucumán', country: 'Argentina', label: 'Tucumán, Argentina' },
  { id: 'la-plata-ar', city: 'La Plata', country: 'Argentina', label: 'La Plata, Argentina' },
  
  // Chile
  { id: 'santiago-cl', city: 'Santiago', country: 'Chile', label: 'Santiago, Chile' },
  { id: 'valparaiso-cl', city: 'Valparaíso', country: 'Chile', label: 'Valparaíso, Chile' },
  { id: 'concepcion-cl', city: 'Concepción', country: 'Chile', label: 'Concepción, Chile' },
  { id: 'la-serena-cl', city: 'La Serena', country: 'Chile', label: 'La Serena, Chile' },
  { id: 'antofagasta-cl', city: 'Antofagasta', country: 'Chile', label: 'Antofagasta, Chile' },
  
  // Mexico
  { id: 'mexico-city-mx', city: 'Mexico City', country: 'Mexico', label: 'Mexico City, Mexico' },
  { id: 'guadalajara-mx', city: 'Guadalajara', country: 'Mexico', label: 'Guadalajara, Mexico' },
  { id: 'monterrey-mx', city: 'Monterrey', country: 'Mexico', label: 'Monterrey, Mexico' },
  { id: 'puebla-mx', city: 'Puebla', country: 'Mexico', label: 'Puebla, Mexico' },
  { id: 'tijuana-mx', city: 'Tijuana', country: 'Mexico', label: 'Tijuana, Mexico' },
  { id: 'leon-mx', city: 'León', country: 'Mexico', label: 'León, Mexico' },
  { id: 'juarez-mx', city: 'Juárez', country: 'Mexico', label: 'Juárez, Mexico' },
  { id: 'torreon-mx', city: 'Torreón', country: 'Mexico', label: 'Torreón, Mexico' },
  
  // Russia
  { id: 'moscow-ru', city: 'Moscow', country: 'Russia', label: 'Moscow, Russia' },
  { id: 'saint-petersburg-ru', city: 'Saint Petersburg', country: 'Russia', label: 'Saint Petersburg, Russia' },
  { id: 'novosibirsk-ru', city: 'Novosibirsk', country: 'Russia', label: 'Novosibirsk, Russia' },
  { id: 'yekaterinburg-ru', city: 'Yekaterinburg', country: 'Russia', label: 'Yekaterinburg, Russia' },
  { id: 'nizhny-novgorod-ru', city: 'Nizhny Novgorod', country: 'Russia', label: 'Nizhny Novgorod, Russia' },
  { id: 'kazan-ru', city: 'Kazan', country: 'Russia', label: 'Kazan, Russia' },
  { id: 'chelyabinsk-ru', city: 'Chelyabinsk', country: 'Russia', label: 'Chelyabinsk, Russia' },
  { id: 'omsk-ru', city: 'Omsk', country: 'Russia', label: 'Omsk, Russia' },
  { id: 'samara-ru', city: 'Samara', country: 'Russia', label: 'Samara, Russia' },
  { id: 'rostov-on-don-ru', city: 'Rostov-on-Don', country: 'Russia', label: 'Rostov-on-Don, Russia' },
  
  // Poland
  { id: 'warsaw-pl', city: 'Warsaw', country: 'Poland', label: 'Warsaw, Poland' },
  { id: 'krakow-pl', city: 'Kraków', country: 'Poland', label: 'Kraków, Poland' },
  { id: 'lodz-pl', city: 'Łódź', country: 'Poland', label: 'Łódź, Poland' },
  { id: 'wroclaw-pl', city: 'Wrocław', country: 'Poland', label: 'Wrocław, Poland' },
  { id: 'poznan-pl', city: 'Poznań', country: 'Poland', label: 'Poznań, Poland' },
  { id: 'gdansk-pl', city: 'Gdańsk', country: 'Poland', label: 'Gdańsk, Poland' },
  { id: 'szczecin-pl', city: 'Szczecin', country: 'Poland', label: 'Szczecin, Poland' },
  { id: 'bydgoszcz-pl', city: 'Bydgoszcz', country: 'Poland', label: 'Bydgoszcz, Poland' },
  { id: 'lublin-pl', city: 'Lublin', country: 'Poland', label: 'Lublin, Poland' },
  { id: 'katowice-pl', city: 'Katowice', country: 'Poland', label: 'Katowice, Poland' },
  
  // Czech Republic
  { id: 'prague-cz', city: 'Prague', country: 'Czech Republic', label: 'Prague, Czech Republic' },
  { id: 'brno-cz', city: 'Brno', country: 'Czech Republic', label: 'Brno, Czech Republic' },
  { id: 'ostrava-cz', city: 'Ostrava', country: 'Czech Republic', label: 'Ostrava, Czech Republic' },
  { id: 'plzen-cz', city: 'Plzen', country: 'Czech Republic', label: 'Plzen, Czech Republic' },
  { id: 'liberec-cz', city: 'Liberec', country: 'Czech Republic', label: 'Liberec, Czech Republic' },
  { id: 'olomouc-cz', city: 'Olomouc', country: 'Czech Republic', label: 'Olomouc, Czech Republic' },
  
  // Hungary
  { id: 'budapest-hu', city: 'Budapest', country: 'Hungary', label: 'Budapest, Hungary' },
  { id: 'debrecen-hu', city: 'Debrecen', country: 'Hungary', label: 'Debrecen, Hungary' },
  { id: 'szeged-hu', city: 'Szeged', country: 'Hungary', label: 'Szeged, Hungary' },
  { id: 'miskolc-hu', city: 'Miskolc', country: 'Hungary', label: 'Miskolc, Hungary' },
  { id: 'pecs-hu', city: 'Pécs', country: 'Hungary', label: 'Pécs, Hungary' },
  { id: 'gyor-hu', city: 'Győr', country: 'Hungary', label: 'Győr, Hungary' },
  
  // Slovenia
  { id: 'ljubljana-si', city: 'Ljubljana', country: 'Slovenia', label: 'Ljubljana, Slovenia' },
  { id: 'maribor-si', city: 'Maribor', country: 'Slovenia', label: 'Maribor, Slovenia' },
  { id: 'celje-si', city: 'Celje', country: 'Slovenia', label: 'Celje, Slovenia' },
  { id: 'kranj-si', city: 'Kranj', country: 'Slovenia', label: 'Kranj, Slovenia' },
  { id: 'velenje-si', city: 'Velenje', country: 'Slovenia', label: 'Velenje, Slovenia' },
  { id: 'koper-si', city: 'Koper', country: 'Slovenia', label: 'Koper, Slovenia' },
  
  // Serbia
  { id: 'belgrade-rs', city: 'Belgrade', country: 'Serbia', label: 'Belgrade, Serbia' },
  { id: 'novi-sad-rs', city: 'Novi Sad', country: 'Serbia', label: 'Novi Sad, Serbia' },
  { id: 'nis-rs', city: 'Niš', country: 'Serbia', label: 'Niš, Serbia' },
  { id: 'kragujevac-rs', city: 'Kragujevac', country: 'Serbia', label: 'Kragujevac, Serbia' },
  { id: 'subotica-rs', city: 'Subotica', country: 'Serbia', label: 'Subotica, Serbia' },
  { id: 'novi-pazar-rs', city: 'Novi Pazar', country: 'Serbia', label: 'Novi Pazar, Serbia' },
  
  // Bosnia and Herzegovina
  { id: 'sarajevo-ba', city: 'Sarajevo', country: 'Bosnia and Herzegovina', label: 'Sarajevo, Bosnia and Herzegovina' },
  { id: 'banja-luka-ba', city: 'Banja Luka', country: 'Bosnia and Herzegovina', label: 'Banja Luka, Bosnia and Herzegovina' },
  { id: 'tuzla-ba', city: 'Tuzla', country: 'Bosnia and Herzegovina', label: 'Tuzla, Bosnia and Herzegovina' },
  { id: 'zenica-ba', city: 'Zenica', country: 'Bosnia and Herzegovina', label: 'Zenica, Bosnia and Herzegovina' },
  { id: 'mostar-ba', city: 'Mostar', country: 'Bosnia and Herzegovina', label: 'Mostar, Bosnia and Herzegovina' },
  
  // Montenegro
  { id: 'podgorica-me', city: 'Podgorica', country: 'Montenegro', label: 'Podgorica, Montenegro' },
  { id: 'nikšić-me', city: 'Nikšić', country: 'Montenegro', label: 'Nikšić, Montenegro' },
  { id: 'pljevlja-me', city: 'Pljevlja', country: 'Montenegro', label: 'Pljevlja, Montenegro' },
  { id: 'bijelo-polje-me', city: 'Bijelo Polje', country: 'Montenegro', label: 'Bijelo Polje, Montenegro' },
  
  // North Macedonia
  { id: 'skopje-mk', city: 'Skopje', country: 'North Macedonia', label: 'Skopje, North Macedonia' },
  { id: 'bitola-mk', city: 'Bitola', country: 'North Macedonia', label: 'Bitola, North Macedonia' },
  { id: 'kumanovo-mk', city: 'Kumanovo', country: 'North Macedonia', label: 'Kumanovo, North Macedonia' },
  { id: 'prilep-mk', city: 'Prilep', country: 'North Macedonia', label: 'Prilep, North Macedonia' },
  
  // Albania
  { id: 'tirana-al', city: 'Tirana', country: 'Albania', label: 'Tirana, Albania' },
  { id: 'durres-al', city: 'Durrës', country: 'Albania', label: 'Durrës, Albania' },
  { id: 'vlore-al', city: 'Vlorë', country: 'Albania', label: 'Vlorë, Albania' },
  { id: 'shkoder-al', city: 'Shkodër', country: 'Albania', label: 'Shkodër, Albania' },
  
  // Romania
  { id: 'bucharest-ro', city: 'Bucharest', country: 'Romania', label: 'Bucharest, Romania' },
  { id: 'cluj-napoca-ro', city: 'Cluj-Napoca', country: 'Romania', label: 'Cluj-Napoca, Romania' },
  { id: 'timisoara-ro', city: 'Timișoara', country: 'Romania', label: 'Timișoara, Romania' },
  { id: 'iasi-ro', city: 'Iași', country: 'Romania', label: 'Iași, Romania' },
  { id: 'constanta-ro', city: 'Constanța', country: 'Romania', label: 'Constanța, Romania' },
  { id: 'craiova-ro', city: 'Craiova', country: 'Romania', label: 'Craiova, Romania' },
  
  // Bulgaria
  { id: 'sofia-bg', city: 'Sofia', country: 'Bulgaria', label: 'Sofia, Bulgaria' },
  { id: 'plovdiv-bg', city: 'Plovdiv', country: 'Bulgaria', label: 'Plovdiv, Bulgaria' },
  { id: 'varna-bg', city: 'Varna', country: 'Bulgaria', label: 'Varna, Bulgaria' },
  { id: 'burgas-bg', city: 'Burgas', country: 'Bulgaria', label: 'Burgas, Bulgaria' },
  { id: 'ruse-bg', city: 'Ruse', country: 'Bulgaria', label: 'Ruse, Bulgaria' },
  
  // Greece
  { id: 'athens-gr', city: 'Athens', country: 'Greece', label: 'Athens, Greece' },
  { id: 'thessaloniki-gr', city: 'Thessaloniki', country: 'Greece', label: 'Thessaloniki, Greece' },
  { id: 'patras-gr', city: 'Patras', country: 'Greece', label: 'Patras, Greece' },
  { id: 'heraklion-gr', city: 'Heraklion', country: 'Greece', label: 'Heraklion, Greece' },
  { id: 'larissa-gr', city: 'Larissa', country: 'Greece', label: 'Larissa, Greece' },
  
  // Turkey
  { id: 'istanbul-tr', city: 'Istanbul', country: 'Turkey', label: 'Istanbul, Turkey' },
  { id: 'ankara-tr', city: 'Ankara', country: 'Turkey', label: 'Ankara, Turkey' },
  { id: 'izmir-tr', city: 'Izmir', country: 'Turkey', label: 'Izmir, Turkey' },
  { id: 'bursa-tr', city: 'Bursa', country: 'Turkey', label: 'Bursa, Turkey' },
  { id: 'adana-tr', city: 'Adana', country: 'Turkey', label: 'Adana, Turkey' },
  { id: 'gaziantep-tr', city: 'Gaziantep', country: 'Turkey', label: 'Gaziantep, Turkey' },
  
  // Egypt
  { id: 'cairo-eg', city: 'Cairo', country: 'Egypt', label: 'Cairo, Egypt' },
  { id: 'alexandria-eg', city: 'Alexandria', country: 'Egypt', label: 'Alexandria, Egypt' },
  { id: 'giza-eg', city: 'Giza', country: 'Egypt', label: 'Giza, Egypt' },
  { id: 'shubra-el-kheima-eg', city: 'Shubra El Kheima', country: 'Egypt', label: 'Shubra El Kheima, Egypt' },
  { id: 'port-said-eg', city: 'Port Said', country: 'Egypt', label: 'Port Said, Egypt' },
  
  // Morocco
  { id: 'casablanca-ma', city: 'Casablanca', country: 'Morocco', label: 'Casablanca, Morocco' },
  { id: 'rabat-ma', city: 'Rabat', country: 'Morocco', label: 'Rabat, Morocco' },
  { id: 'fez-ma', city: 'Fez', country: 'Morocco', label: 'Fez, Morocco' },
  { id: 'marrakech-ma', city: 'Marrakech', country: 'Morocco', label: 'Marrakech, Morocco' },
  { id: 'agadir-ma', city: 'Agadir', country: 'Morocco', label: 'Agadir, Morocco' },
  
  // Nigeria
  { id: 'lagos-ng', city: 'Lagos', country: 'Nigeria', label: 'Lagos, Nigeria' },
  { id: 'kano-ng', city: 'Kano', country: 'Nigeria', label: 'Kano, Nigeria' },
  { id: 'ibadan-ng', city: 'Ibadan', country: 'Nigeria', label: 'Ibadan, Nigeria' },
  { id: 'abuja-ng', city: 'Abuja', country: 'Nigeria', label: 'Abuja, Nigeria' },
  { id: 'port-harcourt-ng', city: 'Port Harcourt', country: 'Nigeria', label: 'Port Harcourt, Nigeria' },
  
  // Kenya
  { id: 'nairobi-ke', city: 'Nairobi', country: 'Kenya', label: 'Nairobi, Kenya' },
  { id: 'mombasa-ke', city: 'Mombasa', country: 'Kenya', label: 'Mombasa, Kenya' },
  { id: 'kisumu-ke', city: 'Kisumu', country: 'Kenya', label: 'Kisumu, Kenya' },
  { id: 'nakuru-ke', city: 'Nakuru', country: 'Kenya', label: 'Nakuru, Kenya' },
  { id: 'eldoret-ke', city: 'Eldoret', country: 'Kenya', label: 'Eldoret, Kenya' },
  
  // Ghana
  { id: 'accra-gh', city: 'Accra', country: 'Ghana', label: 'Accra, Ghana' },
  { id: 'kumasi-gh', city: 'Kumasi', country: 'Ghana', label: 'Kumasi, Ghana' },
  { id: 'tamale-gh', city: 'Tamale', country: 'Ghana', label: 'Tamale, Ghana' },
  { id: 'cape-coast-gh', city: 'Cape Coast', country: 'Ghana', label: 'Cape Coast, Ghana' },
  
  // Israel
  { id: 'jerusalem-il', city: 'Jerusalem', country: 'Israel', label: 'Jerusalem, Israel' },
  { id: 'tel-aviv-il', city: 'Tel Aviv', country: 'Israel', label: 'Tel Aviv, Israel' },
  { id: 'haifa-il', city: 'Haifa', country: 'Israel', label: 'Haifa, Israel' },
  { id: 'rishon-lezion-il', city: 'Rishon LeZion', country: 'Israel', label: 'Rishon LeZion, Israel' },
  { id: 'petah-tikva-il', city: 'Petah Tikva', country: 'Israel', label: 'Petah Tikva, Israel' },
  
  // UAE
  { id: 'dubai-ae', city: 'Dubai', country: 'UAE', label: 'Dubai, UAE' },
  { id: 'abu-dhabi-ae', city: 'Abu Dhabi', country: 'UAE', label: 'Abu Dhabi, UAE' },
  { id: 'sharjah-ae', city: 'Sharjah', country: 'UAE', label: 'Sharjah, UAE' },
  { id: 'al-ain-ae', city: 'Al Ain', country: 'UAE', label: 'Al Ain, UAE' },
  { id: 'ajman-ae', city: 'Ajman', country: 'UAE', label: 'Ajman, UAE' },
  
  // Saudi Arabia
  { id: 'riyadh-sa', city: 'Riyadh', country: 'Saudi Arabia', label: 'Riyadh, Saudi Arabia' },
  { id: 'jeddah-sa', city: 'Jeddah', country: 'Saudi Arabia', label: 'Jeddah, Saudi Arabia' },
  { id: 'mecca-sa', city: 'Mecca', country: 'Saudi Arabia', label: 'Mecca, Saudi Arabia' },
  { id: 'medina-sa', city: 'Medina', country: 'Saudi Arabia', label: 'Medina, Saudi Arabia' },
  { id: 'dammam-sa', city: 'Dammam', country: 'Saudi Arabia', label: 'Dammam, Saudi Arabia' },
];

// Built-in suggestion fetcher using the comprehensive cities database
async function fetchCitySuggestions(query: string): Promise<Suggestion[]> {
  const q = query.toLowerCase().trim();
  if (q.length < 1) return [];
  
  return MAJOR_CITIES
    .filter(city => 
      city.city.toLowerCase().includes(q) || 
      city.country.toLowerCase().includes(q) ||
      city.label.toLowerCase().includes(q)
    )
    .slice(0, 12) // Show more suggestions
    .map(city => ({
      id: city.id,
      city: city.city,
      country: city.country,
      label: city.label
    }));
}

export default function LocationInput({
  label,
  value,
  placeholder = 'Start typing your birth city…',
  onLocationChange,
  minChars = 1, // Reduced from 2 to 1 for faster suggestions
}: LocationInputProps) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const inputRef = useRef<TextInput>(null);
  const blurTimer = useRef<any>(null);

  // keep internal q in sync if parent value changes externally
  useEffect(() => setQ(value), [value]);

  // fetch suggestions as user types
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const query = q.trim();
      if (query.length < minChars) {
        if (!cancelled) {
          setItems([]);
          setOpen(false);
        }
        return;
      }
      try {
        const results = await fetchCitySuggestions(query);
        if (!cancelled) {
          setItems(results || []);
          setOpen((results?.length ?? 0) > 0);
          console.log('🔍 [LocationInput] Found suggestions:', results?.length, 'for query:', query);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setOpen(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, minChars]);

  const handleSelect = (s: Suggestion) => {
    const label = s.label || `${s.city}, ${s.country}`;
    console.log('🔍 [LocationInput] Suggestion selected:', label);
    onLocationChange(label);
    setQ(label);
    setOpen(false);
    Keyboard.dismiss();
  };

  // Web-specific: select BEFORE blur kills the dropdown
  const handleMouseDown = (e: any, s: Suggestion) => {
    if (Platform.OS === 'web') {
      e?.preventDefault?.(); // avoid losing focus before we apply selection
      handleSelect(s);
    }
  };

  return (
    <View 
      style={styles.wrap}
      pointerEvents="auto"
    >
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <LinearGradient
        colors={['rgba(26, 26, 46, 0.4)', 'rgba(26, 26, 46, 0.2)']}
        style={styles.inputContainer}
      >
        <MapPin size={20} color="#8b9dc3" style={styles.icon} />
        <TextInput
          ref={inputRef}
          value={q}
          onChangeText={(t) => {
            setQ(t);
            onLocationChange(t); // keep parent in sync as user types
          }}
          placeholder={placeholder}
          placeholderTextColor="#8b9dc3"
          style={styles.input}
          onFocus={() => {
            // Show suggestions immediately on focus if we have any
            if (q.length >= minChars) {
              fetchCitySuggestions(q).then(results => {
                setItems(results);
                setOpen(results.length > 0);
              });
            }
          }}
          onBlur={() => {
            // Delay closing so a tap on a row can register
            if (Platform.OS !== 'web') {
              blurTimer.current && clearTimeout(blurTimer.current);
              blurTimer.current = setTimeout(() => setOpen(false), 200);
            } else {
              // On web, delay longer to allow mouse events to complete
              setTimeout(() => setOpen(false), 300);
            }
          }}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </LinearGradient>

      {open && items.length > 0 && (
        <View 
          style={styles.dropdown} 
          pointerEvents="auto"
          onStartShouldSetResponder={() => true}
        >
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.98)', 'rgba(16, 21, 62, 0.95)']}
            style={styles.dropdownGradient}
          >
            <FlatList
              keyboardShouldPersistTaps="always"
              data={items}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  // ensure selection works on web before blur:
                  onMouseDown={(e) => handleMouseDown(e, item)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.8 },
                    Platform.OS === 'web' && { cursor: 'pointer' },
                  ]}
                >
                  <MapPin size={16} color="#8b9dc3" />
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionCity}>{item.city}</Text>
                    <Text style={styles.suggestionCountry}>{item.country}</Text>
                  </View>
                  <Check size={16} color="#d4af37" />
                </Pressable>
              )}
              style={styles.suggestionsList}
              nestedScrollEnabled
              removeClippedSubviews={false}
              scrollEnabled
            />
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    width: '100%',
    marginVertical: 12,
    // IMPORTANT: allow dropdown to escape
    overflow: 'visible',
    zIndex: 1,
  },
  label: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 52,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    fontSize: 18,
    fontFamily: 'Vazirmatn-Regular',
    color: '#e8e8e8',
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    maxHeight: 250, // Increased height for more suggestions
    // keep above everything:
    zIndex: 9999,
    elevation: 10,
  },
  dropdownGradient: {
    flex: 1,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 157, 195, 0.2)',
    minHeight: 48,
    backgroundColor: 'transparent',
  },
  suggestionContent: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionCity: {
    fontSize: 16,
    fontFamily: 'Vazirmatn-Medium',
    color: '#e8e8e8',
  },
  suggestionCountry: {
    fontSize: 14,
    fontFamily: 'Vazirmatn-Regular',
    color: '#8b9dc3',
  },
});