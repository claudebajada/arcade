import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════
// ALL 193 UN MEMBER STATES
// n=name, f=flag, c=capital, r=region, t=traits, b=borders
// ═══════════════════════════════════════════════════════════════════════
const ALL_COUNTRIES = [
  // EUROPE (43)
  {n:"Albania",f:"🇦🇱",c:"Tirana",r:"Europe",t:["coastal","mountain","ancient"],b:["Montenegro","North Macedonia","Greece"]},
  {n:"Andorra",f:"🇦🇩",c:"Andorra la Vella",r:"Europe",t:["landlocked","mountain","tourism"],b:["France","Spain"]},
  {n:"Austria",f:"🇦🇹",c:"Vienna",r:"Europe",t:["landlocked","mountain","music","chocolate"],b:["Germany","Czech Republic","Slovakia","Hungary","Slovenia","Italy","Switzerland","Liechtenstein"]},
  {n:"Belarus",f:"🇧🇾",c:"Minsk",r:"Europe",t:["landlocked","agriculture"],b:["Russia","Ukraine","Poland","Lithuania","Latvia"]},
  {n:"Belgium",f:"🇧🇪",c:"Brussels",r:"Europe",t:["coastal","chocolate","art"],b:["France","Netherlands","Germany","Luxembourg"]},
  {n:"Bosnia and Herzegovina",f:"🇧🇦",c:"Sarajevo",r:"Europe",t:["coastal","mountain"],b:["Croatia","Serbia","Montenegro"]},
  {n:"Bulgaria",f:"🇧🇬",c:"Sofia",r:"Europe",t:["coastal","mountain","ancient"],b:["Romania","Serbia","North Macedonia","Greece","Turkey"]},
  {n:"Croatia",f:"🇭🇷",c:"Zagreb",r:"Europe",t:["coastal","tourism","ancient"],b:["Slovenia","Hungary","Serbia","Bosnia and Herzegovina","Montenegro"]},
  {n:"Czech Republic",f:"🇨🇿",c:"Prague",r:"Europe",t:["landlocked","engineering","art"],b:["Germany","Poland","Slovakia","Austria"]},
  {n:"Denmark",f:"🇩🇰",c:"Copenhagen",r:"Europe",t:["coastal","island","engineering"],b:["Germany"]},
  {n:"Estonia",f:"🇪🇪",c:"Tallinn",r:"Europe",t:["coastal","tech"],b:["Latvia","Russia"]},
  {n:"Finland",f:"🇫🇮",c:"Helsinki",r:"Europe",t:["coastal","arctic","tech","engineering"],b:["Sweden","Norway","Russia"]},
  {n:"France",f:"🇫🇷",c:"Paris",r:"Europe",t:["coastal","cuisine","art","wine","tourism"],b:["Belgium","Luxembourg","Germany","Switzerland","Italy","Spain","Andorra","Monaco"]},
  {n:"Germany",f:"🇩🇪",c:"Berlin",r:"Europe",t:["coastal","engineering","music","chocolate"],b:["Denmark","Poland","Czech Republic","Austria","Switzerland","France","Luxembourg","Belgium","Netherlands"]},
  {n:"Greece",f:"🇬🇷",c:"Athens",r:"Europe",t:["coastal","island","ancient","tourism","cuisine"],b:["Albania","North Macedonia","Bulgaria","Turkey"]},
  {n:"Hungary",f:"🇭🇺",c:"Budapest",r:"Europe",t:["landlocked","cuisine","music"],b:["Austria","Slovakia","Ukraine","Romania","Serbia","Croatia","Slovenia"]},
  {n:"Iceland",f:"🇮🇸",c:"Reykjavik",r:"Europe",t:["island","coastal","arctic","tourism"],b:[]},
  {n:"Ireland",f:"🇮🇪",c:"Dublin",r:"Europe",t:["island","coastal","music","agriculture"],b:["United Kingdom"]},
  {n:"Italy",f:"🇮🇹",c:"Rome",r:"Europe",t:["coastal","cuisine","art","wine","ancient","tourism"],b:["France","Switzerland","Austria","Slovenia"]},
  {n:"Latvia",f:"🇱🇻",c:"Riga",r:"Europe",t:["coastal","agriculture"],b:["Estonia","Lithuania","Russia","Belarus"]},
  {n:"Liechtenstein",f:"🇱🇮",c:"Vaduz",r:"Europe",t:["landlocked","mountain"],b:["Switzerland","Austria"]},
  {n:"Lithuania",f:"🇱🇹",c:"Vilnius",r:"Europe",t:["coastal","agriculture"],b:["Latvia","Belarus","Poland","Russia"]},
  {n:"Luxembourg",f:"🇱🇺",c:"Luxembourg City",r:"Europe",t:["landlocked","engineering"],b:["Belgium","France","Germany"]},
  {n:"Malta",f:"🇲🇹",c:"Valletta",r:"Europe",t:["island","coastal","ancient","tourism"],b:[]},
  {n:"Moldova",f:"🇲🇩",c:"Chișinău",r:"Europe",t:["landlocked","agriculture","wine"],b:["Romania","Ukraine"]},
  {n:"Monaco",f:"🇲🇨",c:"Monaco",r:"Europe",t:["coastal","tourism"],b:["France"]},
  {n:"Montenegro",f:"🇲🇪",c:"Podgorica",r:"Europe",t:["coastal","mountain","tourism"],b:["Croatia","Bosnia and Herzegovina","Serbia","Albania"]},
  {n:"Netherlands",f:"🇳🇱",c:"Amsterdam",r:"Europe",t:["coastal","engineering","art","agriculture"],b:["Belgium","Germany"]},
  {n:"North Macedonia",f:"🇲🇰",c:"Skopje",r:"Europe",t:["landlocked","mountain","ancient"],b:["Serbia","Bulgaria","Greece","Albania"]},
  {n:"Norway",f:"🇳🇴",c:"Oslo",r:"Europe",t:["coastal","arctic","oil","mountain","engineering"],b:["Sweden","Finland","Russia"]},
  {n:"Poland",f:"🇵🇱",c:"Warsaw",r:"Europe",t:["coastal","engineering","agriculture"],b:["Germany","Czech Republic","Slovakia","Ukraine","Belarus","Lithuania","Russia"]},
  {n:"Portugal",f:"🇵🇹",c:"Lisbon",r:"Europe",t:["coastal","wine","tourism","cuisine"],b:["Spain"]},
  {n:"Romania",f:"🇷🇴",c:"Bucharest",r:"Europe",t:["coastal","mountain","agriculture"],b:["Ukraine","Moldova","Bulgaria","Serbia","Hungary"]},
  {n:"Russia",f:"🇷🇺",c:"Moscow",r:"Europe",t:["coastal","arctic","oil","mountain","engineering"],b:["Norway","Finland","Estonia","Latvia","Lithuania","Poland","Belarus","Ukraine","Georgia","Azerbaijan","Kazakhstan","China","Mongolia","North Korea"]},
  {n:"San Marino",f:"🇸🇲",c:"San Marino",r:"Europe",t:["landlocked","mountain","ancient","tourism"],b:["Italy"]},
  {n:"Serbia",f:"🇷🇸",c:"Belgrade",r:"Europe",t:["landlocked","agriculture","music"],b:["Hungary","Romania","Bulgaria","North Macedonia","Montenegro","Bosnia and Herzegovina","Croatia"]},
  {n:"Slovakia",f:"🇸🇰",c:"Bratislava",r:"Europe",t:["landlocked","mountain","engineering"],b:["Czech Republic","Poland","Ukraine","Hungary","Austria"]},
  {n:"Slovenia",f:"🇸🇮",c:"Ljubljana",r:"Europe",t:["coastal","mountain","tourism"],b:["Italy","Austria","Hungary","Croatia"]},
  {n:"Spain",f:"🇪🇸",c:"Madrid",r:"Europe",t:["coastal","cuisine","art","tourism","wine"],b:["France","Portugal","Andorra"]},
  {n:"Sweden",f:"🇸🇪",c:"Stockholm",r:"Europe",t:["coastal","arctic","engineering","tech"],b:["Norway","Finland"]},
  {n:"Switzerland",f:"🇨🇭",c:"Bern",r:"Europe",t:["landlocked","mountain","chocolate","engineering"],b:["Germany","France","Italy","Austria","Liechtenstein"]},
  {n:"Ukraine",f:"🇺🇦",c:"Kyiv",r:"Europe",t:["coastal","agriculture","engineering"],b:["Russia","Belarus","Poland","Slovakia","Hungary","Romania","Moldova"]},
  {n:"United Kingdom",f:"🇬🇧",c:"London",r:"Europe",t:["island","coastal","music","art","tea","engineering"],b:["Ireland"]},
  // ASIA (32)
  {n:"Afghanistan",f:"🇦🇫",c:"Kabul",r:"Asia",t:["landlocked","mountain","desert","ancient"],b:["Pakistan","Iran","Turkmenistan","Uzbekistan","Tajikistan","China"]},
  {n:"Armenia",f:"🇦🇲",c:"Yerevan",r:"Asia",t:["landlocked","mountain","ancient"],b:["Turkey","Georgia","Azerbaijan","Iran"]},
  {n:"Azerbaijan",f:"🇦🇿",c:"Baku",r:"Asia",t:["coastal","oil","mountain"],b:["Russia","Georgia","Armenia","Iran","Turkey"]},
  {n:"Bangladesh",f:"🇧🇩",c:"Dhaka",r:"Asia",t:["coastal","tropical","agriculture","spice"],b:["India","Myanmar"]},
  {n:"Bhutan",f:"🇧🇹",c:"Thimphu",r:"Asia",t:["landlocked","mountain","temples","tourism"],b:["India","China"]},
  {n:"Brunei",f:"🇧🇳",c:"Bandar Seri Begawan",r:"Asia",t:["coastal","tropical","oil","island"],b:["Malaysia"]},
  {n:"Cambodia",f:"🇰🇭",c:"Phnom Penh",r:"Asia",t:["coastal","tropical","ancient","temples","tourism"],b:["Thailand","Laos","Vietnam"]},
  {n:"China",f:"🇨🇳",c:"Beijing",r:"Asia",t:["coastal","mountain","ancient","tech","cuisine","tea"],b:["Russia","Mongolia","North Korea","Vietnam","Laos","Myanmar","India","Bhutan","Nepal","Pakistan","Afghanistan","Tajikistan","Kyrgyzstan","Kazakhstan"]},
  {n:"Georgia",f:"🇬🇪",c:"Tbilisi",r:"Asia",t:["coastal","mountain","wine","ancient","cuisine"],b:["Russia","Turkey","Armenia","Azerbaijan"]},
  {n:"India",f:"🇮🇳",c:"New Delhi",r:"Asia",t:["coastal","mountain","ancient","cuisine","spice","tea","tech","temples"],b:["Pakistan","China","Nepal","Bhutan","Bangladesh","Myanmar"]},
  {n:"Indonesia",f:"🇮🇩",c:"Jakarta",r:"Asia",t:["island","coastal","tropical","spice","rainforest","mining","cuisine"],b:["Malaysia","Papua New Guinea","Timor-Leste"]},
  {n:"Japan",f:"🇯🇵",c:"Tokyo",r:"Asia",t:["island","coastal","tech","cuisine","temples","mountain","art"],b:[]},
  {n:"Kazakhstan",f:"🇰🇿",c:"Astana",r:"Asia",t:["landlocked","desert","oil","mining","mountain"],b:["Russia","China","Kyrgyzstan","Uzbekistan","Turkmenistan"]},
  {n:"Kyrgyzstan",f:"🇰🇬",c:"Bishkek",r:"Asia",t:["landlocked","mountain"],b:["Kazakhstan","Uzbekistan","Tajikistan","China"]},
  {n:"Laos",f:"🇱🇦",c:"Vientiane",r:"Asia",t:["landlocked","tropical","mountain","temples","coffee"],b:["Myanmar","China","Vietnam","Cambodia","Thailand"]},
  {n:"Malaysia",f:"🇲🇾",c:"Kuala Lumpur",r:"Asia",t:["coastal","tropical","island","rainforest","cuisine","tech"],b:["Thailand","Indonesia","Brunei"]},
  {n:"Maldives",f:"🇲🇻",c:"Malé",r:"Asia",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Mongolia",f:"🇲🇳",c:"Ulaanbaatar",r:"Asia",t:["landlocked","desert","mountain","agriculture"],b:["Russia","China"]},
  {n:"Myanmar",f:"🇲🇲",c:"Naypyidaw",r:"Asia",t:["coastal","tropical","mountain","temples","ancient"],b:["India","Bangladesh","China","Laos","Thailand"]},
  {n:"Nepal",f:"🇳🇵",c:"Kathmandu",r:"Asia",t:["landlocked","mountain","temples","ancient","tourism"],b:["India","China"]},
  {n:"North Korea",f:"🇰🇵",c:"Pyongyang",r:"Asia",t:["coastal","mountain"],b:["South Korea","China","Russia"]},
  {n:"Pakistan",f:"🇵🇰",c:"Islamabad",r:"Asia",t:["coastal","mountain","desert","ancient","agriculture","spice"],b:["India","Afghanistan","Iran","China"]},
  {n:"Philippines",f:"🇵🇭",c:"Manila",r:"Asia",t:["island","coastal","tropical","mining","tourism"],b:[]},
  {n:"Singapore",f:"🇸🇬",c:"Singapore",r:"Asia",t:["island","coastal","tech","cuisine","engineering","tourism"],b:["Malaysia"]},
  {n:"South Korea",f:"🇰🇷",c:"Seoul",r:"Asia",t:["coastal","tech","cuisine","music","engineering"],b:["North Korea"]},
  {n:"Sri Lanka",f:"🇱🇰",c:"Colombo",r:"Asia",t:["island","coastal","tropical","tea","spice","ancient","temples"],b:[]},
  {n:"Tajikistan",f:"🇹🇯",c:"Dushanbe",r:"Asia",t:["landlocked","mountain"],b:["Kyrgyzstan","Uzbekistan","Afghanistan","China"]},
  {n:"Thailand",f:"🇹🇭",c:"Bangkok",r:"Asia",t:["coastal","tropical","cuisine","temples","tourism","spice"],b:["Myanmar","Laos","Cambodia","Malaysia"]},
  {n:"Timor-Leste",f:"🇹🇱",c:"Dili",r:"Asia",t:["island","coastal","tropical","coffee"],b:["Indonesia"]},
  {n:"Turkmenistan",f:"🇹🇲",c:"Ashgabat",r:"Asia",t:["landlocked","desert","oil"],b:["Kazakhstan","Uzbekistan","Afghanistan","Iran"]},
  {n:"Uzbekistan",f:"🇺🇿",c:"Tashkent",r:"Asia",t:["landlocked","desert","ancient","agriculture"],b:["Kazakhstan","Kyrgyzstan","Tajikistan","Afghanistan","Turkmenistan"]},
  {n:"Vietnam",f:"🇻🇳",c:"Hanoi",r:"Asia",t:["coastal","tropical","cuisine","coffee","agriculture"],b:["China","Laos","Cambodia"]},
  // MIDDLE EAST (14+Turkey=15)
  {n:"Bahrain",f:"🇧🇭",c:"Manama",r:"Middle East",t:["island","coastal","oil","desert"],b:[]},
  {n:"Cyprus",f:"🇨🇾",c:"Nicosia",r:"Middle East",t:["island","coastal","ancient","tourism"],b:[]},
  {n:"Iran",f:"🇮🇷",c:"Tehran",r:"Middle East",t:["coastal","mountain","desert","oil","ancient","cuisine"],b:["Iraq","Turkey","Armenia","Azerbaijan","Turkmenistan","Afghanistan","Pakistan"]},
  {n:"Iraq",f:"🇮🇶",c:"Baghdad",r:"Middle East",t:["coastal","desert","oil","ancient"],b:["Turkey","Iran","Kuwait","Saudi Arabia","Jordan","Syria"]},
  {n:"Israel",f:"🇮🇱",c:"Jerusalem",r:"Middle East",t:["coastal","desert","tech","ancient"],b:["Lebanon","Syria","Jordan","Egypt"]},
  {n:"Jordan",f:"🇯🇴",c:"Amman",r:"Middle East",t:["coastal","desert","ancient","tourism"],b:["Syria","Iraq","Saudi Arabia","Israel"]},
  {n:"Kuwait",f:"🇰🇼",c:"Kuwait City",r:"Middle East",t:["coastal","desert","oil"],b:["Iraq","Saudi Arabia"]},
  {n:"Lebanon",f:"🇱🇧",c:"Beirut",r:"Middle East",t:["coastal","mountain","ancient","cuisine"],b:["Syria","Israel"]},
  {n:"Oman",f:"🇴🇲",c:"Muscat",r:"Middle East",t:["coastal","desert","oil","mountain"],b:["UAE","Saudi Arabia","Yemen"]},
  {n:"Qatar",f:"🇶🇦",c:"Doha",r:"Middle East",t:["coastal","desert","oil","tech"],b:["Saudi Arabia"]},
  {n:"Saudi Arabia",f:"🇸🇦",c:"Riyadh",r:"Middle East",t:["coastal","desert","oil","ancient"],b:["Jordan","Iraq","Kuwait","Qatar","UAE","Oman","Yemen"]},
  {n:"Syria",f:"🇸🇾",c:"Damascus",r:"Middle East",t:["coastal","desert","ancient"],b:["Turkey","Iraq","Jordan","Israel","Lebanon"]},
  {n:"Turkey",f:"🇹🇷",c:"Ankara",r:"Middle East",t:["coastal","mountain","ancient","cuisine","tourism","engineering"],b:["Greece","Bulgaria","Georgia","Armenia","Azerbaijan","Iran","Iraq","Syria"]},
  {n:"United Arab Emirates",f:"🇦🇪",c:"Abu Dhabi",r:"Middle East",t:["coastal","desert","oil","tech","tourism","engineering"],b:["Saudi Arabia","Oman"]},
  {n:"Yemen",f:"🇾🇪",c:"Sana'a",r:"Middle East",t:["coastal","desert","mountain","ancient","coffee"],b:["Saudi Arabia","Oman"]},
  // AFRICA (54)
  {n:"Algeria",f:"🇩🇿",c:"Algiers",r:"Africa",t:["coastal","desert","oil","ancient"],b:["Morocco","Tunisia","Libya","Niger","Mali","Mauritania"]},
  {n:"Angola",f:"🇦🇴",c:"Luanda",r:"Africa",t:["coastal","oil","mining","tropical"],b:["DR Congo","Zambia","Namibia","Republic of Congo"]},
  {n:"Benin",f:"🇧🇯",c:"Porto-Novo",r:"Africa",t:["coastal","tropical","agriculture"],b:["Togo","Burkina Faso","Niger","Nigeria"]},
  {n:"Botswana",f:"🇧🇼",c:"Gaborone",r:"Africa",t:["landlocked","desert","mining","tourism"],b:["South Africa","Namibia","Zimbabwe","Zambia"]},
  {n:"Burkina Faso",f:"🇧🇫",c:"Ouagadougou",r:"Africa",t:["landlocked","desert","agriculture"],b:["Mali","Niger","Benin","Togo","Ghana","Ivory Coast"]},
  {n:"Burundi",f:"🇧🇮",c:"Gitega",r:"Africa",t:["landlocked","tropical","mountain","agriculture","coffee"],b:["DR Congo","Rwanda","Tanzania"]},
  {n:"Cameroon",f:"🇨🇲",c:"Yaoundé",r:"Africa",t:["coastal","tropical","rainforest","agriculture","oil"],b:["Nigeria","Chad","Central African Republic","Republic of Congo","Gabon","Equatorial Guinea"]},
  {n:"Cape Verde",f:"🇨🇻",c:"Praia",r:"Africa",t:["island","coastal","tropical","tourism","music"],b:[]},
  {n:"Central African Republic",f:"🇨🇫",c:"Bangui",r:"Africa",t:["landlocked","tropical","rainforest","mining"],b:["Chad","Sudan","South Sudan","DR Congo","Republic of Congo","Cameroon"]},
  {n:"Chad",f:"🇹🇩",c:"N'Djamena",r:"Africa",t:["landlocked","desert","oil","agriculture"],b:["Libya","Sudan","Central African Republic","Cameroon","Nigeria","Niger"]},
  {n:"Comoros",f:"🇰🇲",c:"Moroni",r:"Africa",t:["island","coastal","tropical","spice"],b:[]},
  {n:"DR Congo",f:"🇨🇩",c:"Kinshasa",r:"Africa",t:["coastal","tropical","rainforest","mining"],b:["Republic of Congo","Central African Republic","South Sudan","Uganda","Rwanda","Burundi","Tanzania","Zambia","Angola"]},
  {n:"Republic of Congo",f:"🇨🇬",c:"Brazzaville",r:"Africa",t:["coastal","tropical","rainforest","oil"],b:["Gabon","Cameroon","Central African Republic","DR Congo","Angola"]},
  {n:"Ivory Coast",f:"🇨🇮",c:"Yamoussoukro",r:"Africa",t:["coastal","tropical","agriculture","chocolate","coffee"],b:["Liberia","Guinea","Mali","Burkina Faso","Ghana"]},
  {n:"Djibouti",f:"🇩🇯",c:"Djibouti",r:"Africa",t:["coastal","desert"],b:["Eritrea","Ethiopia","Somalia"]},
  {n:"Egypt",f:"🇪🇬",c:"Cairo",r:"Africa",t:["coastal","desert","ancient","tourism","agriculture"],b:["Libya","Sudan","Israel"]},
  {n:"Equatorial Guinea",f:"🇬🇶",c:"Malabo",r:"Africa",t:["coastal","tropical","oil","island"],b:["Cameroon","Gabon"]},
  {n:"Eritrea",f:"🇪🇷",c:"Asmara",r:"Africa",t:["coastal","desert","mountain"],b:["Sudan","Ethiopia","Djibouti"]},
  {n:"Eswatini",f:"🇸🇿",c:"Mbabane",r:"Africa",t:["landlocked","mountain","agriculture"],b:["South Africa","Mozambique"]},
  {n:"Ethiopia",f:"🇪🇹",c:"Addis Ababa",r:"Africa",t:["landlocked","mountain","ancient","coffee","agriculture"],b:["Eritrea","Djibouti","Somalia","Kenya","South Sudan","Sudan"]},
  {n:"Gabon",f:"🇬🇦",c:"Libreville",r:"Africa",t:["coastal","tropical","rainforest","oil"],b:["Equatorial Guinea","Cameroon","Republic of Congo"]},
  {n:"Gambia",f:"🇬🇲",c:"Banjul",r:"Africa",t:["coastal","tropical","agriculture","tourism"],b:["Senegal"]},
  {n:"Ghana",f:"🇬🇭",c:"Accra",r:"Africa",t:["coastal","tropical","mining","chocolate","music"],b:["Ivory Coast","Burkina Faso","Togo"]},
  {n:"Guinea",f:"🇬🇳",c:"Conakry",r:"Africa",t:["coastal","tropical","mining","agriculture"],b:["Guinea-Bissau","Senegal","Mali","Ivory Coast","Liberia","Sierra Leone"]},
  {n:"Guinea-Bissau",f:"🇬🇼",c:"Bissau",r:"Africa",t:["coastal","tropical","agriculture"],b:["Senegal","Guinea"]},
  {n:"Kenya",f:"🇰🇪",c:"Nairobi",r:"Africa",t:["coastal","tropical","tourism","tea","coffee","agriculture"],b:["Ethiopia","Somalia","Tanzania","Uganda","South Sudan"]},
  {n:"Lesotho",f:"🇱🇸",c:"Maseru",r:"Africa",t:["landlocked","mountain","agriculture"],b:["South Africa"]},
  {n:"Liberia",f:"🇱🇷",c:"Monrovia",r:"Africa",t:["coastal","tropical","rainforest","mining"],b:["Sierra Leone","Guinea","Ivory Coast"]},
  {n:"Libya",f:"🇱🇾",c:"Tripoli",r:"Africa",t:["coastal","desert","oil","ancient"],b:["Tunisia","Algeria","Niger","Chad","Sudan","Egypt"]},
  {n:"Madagascar",f:"🇲🇬",c:"Antananarivo",r:"Africa",t:["island","coastal","tropical","rainforest","spice","agriculture"],b:[]},
  {n:"Malawi",f:"🇲🇼",c:"Lilongwe",r:"Africa",t:["landlocked","tropical","agriculture","tea"],b:["Mozambique","Tanzania","Zambia"]},
  {n:"Mali",f:"🇲🇱",c:"Bamako",r:"Africa",t:["landlocked","desert","ancient","music","agriculture"],b:["Algeria","Niger","Burkina Faso","Ivory Coast","Guinea","Senegal","Mauritania"]},
  {n:"Mauritania",f:"🇲🇷",c:"Nouakchott",r:"Africa",t:["coastal","desert","mining"],b:["Morocco","Algeria","Mali","Senegal"]},
  {n:"Mauritius",f:"🇲🇺",c:"Port Louis",r:"Africa",t:["island","coastal","tropical","tourism","tea"],b:[]},
  {n:"Morocco",f:"🇲🇦",c:"Rabat",r:"Africa",t:["coastal","desert","mountain","cuisine","ancient","tourism"],b:["Algeria","Mauritania"]},
  {n:"Mozambique",f:"🇲🇿",c:"Maputo",r:"Africa",t:["coastal","tropical","mining","agriculture"],b:["Tanzania","Malawi","Zambia","Zimbabwe","South Africa","Eswatini"]},
  {n:"Namibia",f:"🇳🇦",c:"Windhoek",r:"Africa",t:["coastal","desert","mining","tourism"],b:["Angola","Zambia","Botswana","South Africa"]},
  {n:"Niger",f:"🇳🇪",c:"Niamey",r:"Africa",t:["landlocked","desert","mining","agriculture"],b:["Algeria","Libya","Chad","Nigeria","Benin","Burkina Faso","Mali"]},
  {n:"Nigeria",f:"🇳🇬",c:"Abuja",r:"Africa",t:["coastal","tropical","oil","music","agriculture"],b:["Benin","Niger","Chad","Cameroon"]},
  {n:"Rwanda",f:"🇷🇼",c:"Kigali",r:"Africa",t:["landlocked","tropical","mountain","coffee","tourism"],b:["Uganda","Tanzania","Burundi","DR Congo"]},
  {n:"São Tomé and Príncipe",f:"🇸🇹",c:"São Tomé",r:"Africa",t:["island","coastal","tropical","chocolate"],b:[]},
  {n:"Senegal",f:"🇸🇳",c:"Dakar",r:"Africa",t:["coastal","tropical","agriculture","music","cuisine"],b:["Mauritania","Mali","Guinea","Guinea-Bissau","Gambia"]},
  {n:"Seychelles",f:"🇸🇨",c:"Victoria",r:"Africa",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Sierra Leone",f:"🇸🇱",c:"Freetown",r:"Africa",t:["coastal","tropical","mining"],b:["Guinea","Liberia"]},
  {n:"Somalia",f:"🇸🇴",c:"Mogadishu",r:"Africa",t:["coastal","desert","agriculture"],b:["Djibouti","Ethiopia","Kenya"]},
  {n:"South Africa",f:"🇿🇦",c:"Pretoria",r:"Africa",t:["coastal","mountain","mining","wine","tourism","engineering"],b:["Namibia","Botswana","Zimbabwe","Mozambique","Eswatini","Lesotho"]},
  {n:"South Sudan",f:"🇸🇸",c:"Juba",r:"Africa",t:["landlocked","tropical","oil","agriculture"],b:["Sudan","Ethiopia","Kenya","Uganda","DR Congo","Central African Republic"]},
  {n:"Sudan",f:"🇸🇩",c:"Khartoum",r:"Africa",t:["coastal","desert","oil","ancient","agriculture"],b:["Egypt","Libya","Chad","Central African Republic","South Sudan","Ethiopia","Eritrea"]},
  {n:"Tanzania",f:"🇹🇿",c:"Dodoma",r:"Africa",t:["coastal","tropical","mountain","tourism","coffee","agriculture","mining"],b:["Kenya","Uganda","Rwanda","Burundi","DR Congo","Zambia","Malawi","Mozambique"]},
  {n:"Togo",f:"🇹🇬",c:"Lomé",r:"Africa",t:["coastal","tropical","agriculture"],b:["Ghana","Burkina Faso","Benin"]},
  {n:"Tunisia",f:"🇹🇳",c:"Tunis",r:"Africa",t:["coastal","desert","ancient","tourism","cuisine"],b:["Algeria","Libya"]},
  {n:"Uganda",f:"🇺🇬",c:"Kampala",r:"Africa",t:["landlocked","tropical","agriculture","coffee","tourism"],b:["South Sudan","Kenya","Tanzania","Rwanda","DR Congo"]},
  {n:"Zambia",f:"🇿🇲",c:"Lusaka",r:"Africa",t:["landlocked","tropical","mining","tourism","agriculture"],b:["DR Congo","Tanzania","Malawi","Mozambique","Zimbabwe","Botswana","Namibia","Angola"]},
  {n:"Zimbabwe",f:"🇿🇼",c:"Harare",r:"Africa",t:["landlocked","mining","agriculture","tourism"],b:["Zambia","Mozambique","South Africa","Botswana"]},
  // NORTH AMERICA (3)
  {n:"Canada",f:"🇨🇦",c:"Ottawa",r:"North America",t:["coastal","arctic","mountain","engineering","mining","agriculture","tourism"],b:["United States"]},
  {n:"Mexico",f:"🇲🇽",c:"Mexico City",r:"North America",t:["coastal","desert","mountain","cuisine","ancient","oil","tourism","spice"],b:["United States","Guatemala","Belize"]},
  {n:"United States",f:"🇺🇸",c:"Washington D.C.",r:"North America",t:["coastal","mountain","desert","tech","engineering","agriculture","music","art"],b:["Canada","Mexico"]},
  // CENTRAL AMERICA (7)
  {n:"Belize",f:"🇧🇿",c:"Belmopan",r:"Central America",t:["coastal","tropical","rainforest","tourism","ancient"],b:["Mexico","Guatemala"]},
  {n:"Costa Rica",f:"🇨🇷",c:"San José",r:"Central America",t:["coastal","tropical","rainforest","tourism","coffee","agriculture"],b:["Nicaragua","Panama"]},
  {n:"El Salvador",f:"🇸🇻",c:"San Salvador",r:"Central America",t:["coastal","tropical","mountain","coffee","agriculture"],b:["Guatemala","Honduras"]},
  {n:"Guatemala",f:"🇬🇹",c:"Guatemala City",r:"Central America",t:["coastal","tropical","mountain","ancient","coffee","agriculture"],b:["Mexico","Belize","Honduras","El Salvador"]},
  {n:"Honduras",f:"🇭🇳",c:"Tegucigalpa",r:"Central America",t:["coastal","tropical","mountain","ancient","agriculture","coffee"],b:["Guatemala","El Salvador","Nicaragua"]},
  {n:"Nicaragua",f:"🇳🇮",c:"Managua",r:"Central America",t:["coastal","tropical","agriculture","coffee"],b:["Honduras","Costa Rica"]},
  {n:"Panama",f:"🇵🇦",c:"Panama City",r:"Central America",t:["coastal","tropical","rainforest","engineering","tourism"],b:["Costa Rica","Colombia"]},
  // CARIBBEAN (13)
  {n:"Antigua and Barbuda",f:"🇦🇬",c:"St. John's",r:"Caribbean",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Bahamas",f:"🇧🇸",c:"Nassau",r:"Caribbean",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Barbados",f:"🇧🇧",c:"Bridgetown",r:"Caribbean",t:["island","coastal","tropical","tourism","music"],b:[]},
  {n:"Cuba",f:"🇨🇺",c:"Havana",r:"Caribbean",t:["island","coastal","tropical","music","cuisine","agriculture"],b:[]},
  {n:"Dominica",f:"🇩🇲",c:"Roseau",r:"Caribbean",t:["island","coastal","tropical","rainforest","tourism"],b:[]},
  {n:"Dominican Republic",f:"🇩🇴",c:"Santo Domingo",r:"Caribbean",t:["island","coastal","tropical","tourism","music","agriculture"],b:["Haiti"]},
  {n:"Grenada",f:"🇬🇩",c:"St. George's",r:"Caribbean",t:["island","coastal","tropical","spice","tourism"],b:[]},
  {n:"Haiti",f:"🇭🇹",c:"Port-au-Prince",r:"Caribbean",t:["island","coastal","tropical","art","music"],b:["Dominican Republic"]},
  {n:"Jamaica",f:"🇯🇲",c:"Kingston",r:"Caribbean",t:["island","coastal","tropical","music","tourism","coffee","spice"],b:[]},
  {n:"Saint Kitts and Nevis",f:"🇰🇳",c:"Basseterre",r:"Caribbean",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Saint Lucia",f:"🇱🇨",c:"Castries",r:"Caribbean",t:["island","coastal","tropical","tourism","mountain"],b:[]},
  {n:"Saint Vincent and the Grenadines",f:"🇻🇨",c:"Kingstown",r:"Caribbean",t:["island","coastal","tropical","agriculture","tourism"],b:[]},
  {n:"Trinidad and Tobago",f:"🇹🇹",c:"Port of Spain",r:"Caribbean",t:["island","coastal","tropical","oil","carnival","music","cuisine","spice"],b:[]},
  // SOUTH AMERICA (12)
  {n:"Argentina",f:"🇦🇷",c:"Buenos Aires",r:"South America",t:["coastal","mountain","agriculture","wine","cuisine","music"],b:["Chile","Bolivia","Paraguay","Brazil","Uruguay"]},
  {n:"Bolivia",f:"🇧🇴",c:"Sucre",r:"South America",t:["landlocked","mountain","mining","ancient","agriculture"],b:["Brazil","Paraguay","Argentina","Chile","Peru"]},
  {n:"Brazil",f:"🇧🇷",c:"Brasília",r:"South America",t:["coastal","tropical","rainforest","carnival","coffee","agriculture","mining","music"],b:["Suriname","Guyana","Venezuela","Colombia","Peru","Bolivia","Paraguay","Argentina","Uruguay"]},
  {n:"Chile",f:"🇨🇱",c:"Santiago",r:"South America",t:["coastal","mountain","desert","mining","wine","agriculture"],b:["Peru","Bolivia","Argentina"]},
  {n:"Colombia",f:"🇨🇴",c:"Bogotá",r:"South America",t:["coastal","tropical","mountain","coffee","rainforest","carnival","music","cuisine"],b:["Venezuela","Brazil","Peru","Ecuador","Panama"]},
  {n:"Ecuador",f:"🇪🇨",c:"Quito",r:"South America",t:["coastal","mountain","tropical","oil","agriculture","chocolate"],b:["Colombia","Peru"]},
  {n:"Guyana",f:"🇬🇾",c:"Georgetown",r:"South America",t:["coastal","tropical","rainforest","mining","agriculture"],b:["Venezuela","Brazil","Suriname"]},
  {n:"Paraguay",f:"🇵🇾",c:"Asunción",r:"South America",t:["landlocked","tropical","agriculture"],b:["Argentina","Bolivia","Brazil"]},
  {n:"Peru",f:"🇵🇪",c:"Lima",r:"South America",t:["coastal","mountain","desert","ancient","cuisine","mining","coffee","agriculture"],b:["Ecuador","Colombia","Brazil","Bolivia","Chile"]},
  {n:"Suriname",f:"🇸🇷",c:"Paramaribo",r:"South America",t:["coastal","tropical","rainforest","mining"],b:["Guyana","Brazil"]},
  {n:"Uruguay",f:"🇺🇾",c:"Montevideo",r:"South America",t:["coastal","agriculture","wine","tourism"],b:["Argentina","Brazil"]},
  {n:"Venezuela",f:"🇻🇪",c:"Caracas",r:"South America",t:["coastal","tropical","oil","mountain","carnival"],b:["Colombia","Brazil","Guyana"]},
  // OCEANIA (14)
  {n:"Australia",f:"🇦🇺",c:"Canberra",r:"Oceania",t:["island","coastal","desert","mining","tourism","agriculture","engineering","wine"],b:[]},
  {n:"Fiji",f:"🇫🇯",c:"Suva",r:"Oceania",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Kiribati",f:"🇰🇮",c:"Tarawa",r:"Oceania",t:["island","coastal","tropical"],b:[]},
  {n:"Marshall Islands",f:"🇲🇭",c:"Majuro",r:"Oceania",t:["island","coastal","tropical"],b:[]},
  {n:"Micronesia",f:"🇫🇲",c:"Palikir",r:"Oceania",t:["island","coastal","tropical"],b:[]},
  {n:"Nauru",f:"🇳🇷",c:"Yaren",r:"Oceania",t:["island","coastal","tropical","mining"],b:[]},
  {n:"New Zealand",f:"🇳🇿",c:"Wellington",r:"Oceania",t:["island","coastal","mountain","tourism","agriculture","engineering"],b:[]},
  {n:"Palau",f:"🇵🇼",c:"Ngerulmud",r:"Oceania",t:["island","coastal","tropical","tourism"],b:[]},
  {n:"Papua New Guinea",f:"🇵🇬",c:"Port Moresby",r:"Oceania",t:["island","coastal","tropical","rainforest","mining","coffee"],b:["Indonesia"]},
  {n:"Samoa",f:"🇼🇸",c:"Apia",r:"Oceania",t:["island","coastal","tropical","agriculture"],b:[]},
  {n:"Solomon Islands",f:"🇸🇧",c:"Honiara",r:"Oceania",t:["island","coastal","tropical","rainforest","mining"],b:[]},
  {n:"Tonga",f:"🇹🇴",c:"Nukuʻalofa",r:"Oceania",t:["island","coastal","tropical","agriculture"],b:[]},
  {n:"Tuvalu",f:"🇹🇻",c:"Funafuti",r:"Oceania",t:["island","coastal","tropical"],b:[]},
  {n:"Vanuatu",f:"🇻🇺",c:"Port Vila",r:"Oceania",t:["island","coastal","tropical","tourism","agriculture"],b:[]},
];

// ═══════════════════════════════════════════════════════════════════════
// CRISES
// ═══════════════════════════════════════════════════════════════════════
const ALL_CRISES=[
  {title:"THE GREAT RUBBER DUCK MIGRATION",brief:"40,000 rubber ducks have drifted into the Suez Canal, blocking all maritime traffic. Egypt demands international ducking assistance immediately.",requirements:[{type:"region",value:"Africa",label:"An African nation"},{type:"trait",value:"coastal",label:"A coastal nation"}],difficulty:1,seals:1},
  {title:"MISPLACED ORCHESTRA",brief:"The Vienna Philharmonic arrived in Lima, Peru instead of Lima, Ohio. They refuse to leave without a concert hall and 200 litres of Viennese coffee.",requirements:[{type:"region",value:"South America",label:"A South American nation"},{type:"trait",value:"music",label:"A musical nation"}],difficulty:1,seals:1},
  {title:"THE LOST PENGUIN DELEGATION",brief:"47 emperor penguins have waddle-marched into a Caribbean resort claiming diplomatic asylum from the cold. They are eating all the shrimp.",requirements:[{type:"region",value:"Caribbean",label:"A Caribbean nation"},{type:"trait",value:"arctic",label:"An arctic nation"}],difficulty:1,seals:1},
  {title:"CHOCOLATE FOUNTAIN OVERFLOW",brief:"A Swiss factory malfunction sent chocolate flowing downhill toward three countries. Tourists flock. Farmers rage. Bears rejoice.",requirements:[{type:"trait",value:"chocolate",label:"A chocolate nation"},{type:"region",value:"Europe",label:"A European nation"}],difficulty:1,seals:1},
  {title:"COFFEE BEAN CONFUSION",brief:"An international coffee shipment was labelled 'decorative gravel.' Twelve cafes across three continents have run dry. Productivity has halved globally.",requirements:[{type:"trait",value:"coffee",label:"A coffee nation"},{type:"trait",value:"engineering",label:"An engineering nation"}],difficulty:1,seals:1},
  {title:"THE KITE CATASTROPHE",brief:"A giant kite festival blown across three borders. Kites entangle power lines in four countries. One kite is the size of a football pitch.",requirements:[{type:"region",value:"Asia",label:"An Asian nation"},{type:"trait",value:"engineering",label:"An engineering nation"},{type:"trait",value:"tropical",label:"A tropical nation"}],difficulty:2,seals:2},
  {title:"AIRPORT SIGN SWAP SCANDAL",brief:"A prankster swapped departure signs at 14 airports. Tokyo-bound passengers land in Buenos Aires. Nobody minds the food, though.",requirements:[{type:"trait",value:"tech",label:"A tech nation"},{type:"region",value:"Asia",label:"An Asian nation"},{type:"trait",value:"cuisine",label:"A culinary nation"}],difficulty:2,seals:2},
  {title:"WHALE SONG DIPLOMATIC ROW",brief:"Humpback whales are singing the French national anthem off Japan's coast. France demands royalties. Japan claims artistic freedom of the seas.",requirements:[{type:"region",value:"Europe",label:"A European nation"},{type:"trait",value:"island",label:"An island nation"},{type:"trait",value:"art",label:"An artistic nation"}],difficulty:2,seals:2},
  {title:"CARNIVAL FLOAT GOES ROGUE",brief:"A giant toucan float broke free in Rio and is now drifting across the Atlantic. It has 2M social media followers and a verified account.",requirements:[{type:"trait",value:"carnival",label:"A carnival nation"},{type:"region",value:"Africa",label:"An African nation"},{type:"trait",value:"coastal",label:"A coastal nation"}],difficulty:2,seals:2},
  {title:"THE SPICE ROUTE REVIVAL",brief:"Ancient spice routes mysteriously reactivated. Confused camels loaded with saffron are appearing in European cities. Brussels traffic: standstill.",requirements:[{type:"trait",value:"spice",label:"A spice nation"},{type:"trait",value:"ancient",label:"A nation with ancient heritage"},{type:"region",value:"Europe",label:"A European nation"}],difficulty:2,seals:2},
  {title:"TEA VS COFFEE SUMMIT COLLAPSE",brief:"The Tea vs Coffee Peace Summit erupted after someone served instant coffee to the tea delegation. Three ambassadors locked themselves in the biscuit cupboard.",requirements:[{type:"trait",value:"tea",label:"A tea nation"},{type:"trait",value:"coffee",label:"A coffee nation"},{type:"trait",value:"cuisine",label:"A culinary mediator"}],difficulty:2,seals:2},
  {title:"TEMPLE TREASURE MAP LEAK",brief:"An ancient map found in a temple shows a route crossing seven borders. Every nation on the route claims ownership. Indiana Jones declined to comment.",requirements:[{type:"trait",value:"temples",label:"A temple nation"},{type:"trait",value:"ancient",label:"An ancient-heritage nation"},{type:"trait",value:"tourism",label:"A tourism nation"}],difficulty:2,seals:2},
  {title:"THE VOLCANIC POTATO INCIDENT",brief:"A car-sized potato rolled out of an Icelandic volcano and is gaining speed through Central Europe. It crossed customs three times. It is reportedly delicious.",requirements:[{type:"trait",value:"mountain",label:"A mountain nation"},{type:"trait",value:"cuisine",label:"A culinary nation"},{type:"trait",value:"engineering",label:"An engineering nation"},{type:"region",value:"Europe",label:"A European nation"}],difficulty:3,seals:3},
  {title:"THE DESERT MIRAGE TREATY",brief:"Three desert nations discovered their borders overlap due to an 1887 mirage-based mapping error. Each claims the oasis. The camels remain neutral.",requirements:[{type:"trait",value:"desert",label:"A desert nation"},{type:"region",value:"Middle East",label:"A Middle Eastern nation"},{type:"region",value:"Africa",label:"An African nation"},{type:"trait",value:"ancient",label:"An ancient-heritage nation"}],difficulty:3,seals:3},
  {title:"RAINFOREST WIFI CRISIS",brief:"The Amazon gained sentient WiFi from a satellite malfunction. Trees are emailing world leaders demanding better climate policy. The emails are well-written.",requirements:[{type:"trait",value:"rainforest",label:"A rainforest nation"},{type:"trait",value:"tech",label:"A tech nation"},{type:"region",value:"South America",label:"A South American nation"},{type:"trait",value:"engineering",label:"An engineering nation"}],difficulty:3,seals:3},
  {title:"GREAT WINE LAKE OVERFLOW",brief:"A global harvest surplus created a wine lake threatening international waters. Sommeliers call it 'well-balanced with notes of crisis.'",requirements:[{type:"trait",value:"wine",label:"A wine nation"},{type:"trait",value:"agriculture",label:"An agricultural nation"},{type:"trait",value:"coastal",label:"A coastal nation"},{type:"trait",value:"engineering",label:"An engineering nation"}],difficulty:3,seals:3},
  {title:"MINING DRONE SWARM ESCAPE",brief:"Autonomous mining drones escaped a facility and are digging unauthorized tunnels under three countries. They struck gold twice and refuse to share.",requirements:[{type:"trait",value:"mining",label:"A mining nation"},{type:"trait",value:"tech",label:"A tech nation"},{type:"trait",value:"mountain",label:"A mountain nation"},{type:"region",value:"Africa",label:"An African nation"}],difficulty:3,seals:3},
  {title:"ISLAND NATION SUMMIT SHIPWRECK",brief:"A cruise carrying island-nation delegates ran aground on an uncharted island made entirely of recycled plastic bottles. A flag has been planted.",requirements:[{type:"trait",value:"island",label:"An island nation"},{type:"region",value:"Oceania",label:"An Oceanian nation"},{type:"region",value:"Caribbean",label:"A Caribbean nation"},{type:"trait",value:"coastal",label:"A coastal nation"},{type:"trait",value:"engineering",label:"An engineering nation"}],difficulty:4,seals:5},
  {title:"GLOBAL FOOD FESTIVAL FIASCO",brief:"The world's largest food festival served every dish to the wrong country. Japan has paella. Spain has sushi. Everyone is politely eating. Tensions rise over dessert.",requirements:[{type:"trait",value:"cuisine",label:"A culinary nation"},{type:"region",value:"Asia",label:"An Asian nation"},{type:"region",value:"Europe",label:"A European nation"},{type:"trait",value:"tourism",label:"A tourism nation"},{type:"trait",value:"spice",label:"A spice nation"}],difficulty:4,seals:5},
];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════
const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const matchesReq=(country,req)=>{if(req.type==="region")return country.r===req.value;if(req.type==="trait")return country.t.includes(req.value);return false;};
const TRAIT_ICONS={coastal:"🌊",landlocked:"🏔️",island:"🏝️",mountain:"⛰️",desert:"🏜️",tropical:"🌴",arctic:"❄️",rainforest:"🌳",tech:"💻",engineering:"⚙️",oil:"🛢️",mining:"⛏️",agriculture:"🌾",tourism:"✈️",cuisine:"🍽️",art:"🎨",music:"🎵",ancient:"🏛️",temples:"⛩️",carnival:"🎭",coffee:"☕",tea:"🍵",wine:"🍷",chocolate:"🍫",spice:"🌶️"};
const REGION_COLORS={"Europe":"#4A6FA5","Asia":"#D4763C","Middle East":"#C4963C","Africa":"#6B8E50","North America":"#7B5EA7","Central America":"#2E8B8B","Caribbean":"#D45B7A","South America":"#E07C4F","Oceania":"#3DA5A5"};

// ═══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════
export default function EmbassyOfOddballs(){
  const navigate=useNavigate();
  const[screen,setScreen]=useState("title");
  const[difficulty,setDifficulty]=useState("junior");
  const[round,setRound]=useState(0);
  const[score,setScore]=useState(0);
  const[totalSeals,setTotalSeals]=useState(0);
  const[hand,setHand]=useState([]);
  const[deck,setDeck]=useState([]);
  const[crisisQueue,setCrisisQueue]=useState([]);
  const[assignments,setAssignments]=useState({});
  const[hints,setHints]=useState(3);
  const[dispatches,setDispatches]=useState(3);
  const[revealedSlots,setRevealedSlots]=useState(new Set());
  const[dispatchOpen,setDispatchOpen]=useState(false);
  const[dispatchOptions,setDispatchOptions]=useState([]);
  const[swapTarget,setSwapTarget]=useState(null);
  const[resolveResult,setResolveResult]=useState(null);
  const[stampAnim,setStampAnim]=useState(false);
  const[typewriterText,setTypewriterText]=useState("");
  const[typewriterDone,setTypewriterDone]=useState(false);
  const[roundResults,setRoundResults]=useState([]);
  const[hoverCard,setHoverCard]=useState(null);
  const[streak,setStreak]=useState(0);
  const[bestStreak,setBestStreak]=useState(0);
  const[dossierCountry,setDossierCountry]=useState(null);
  const[timeLeft,setTimeLeft]=useState(0);
  const timerRef=useRef(null);

  const infoLevel=useMemo(()=>{
    if(difficulty==="junior")return"full";
    if(difficulty==="attaché")return round<3?"full":"partial";
    return round<2?"full":round<4?"partial":"minimal";
  },[difficulty,round]);

  const TIME_LIMIT=difficulty==="ambassador"?60:difficulty==="attaché"?90:0;

  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:wght@300;400;600&display=swap');
    @keyframes stampSlam{0%{transform:scale(3) rotate(-15deg);opacity:0}50%{transform:scale(1.1) rotate(-8deg);opacity:1}70%{transform:scale(.95) rotate(-6deg)}100%{transform:scale(1) rotate(-8deg);opacity:1}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes sealPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    @keyframes paperSlide{from{transform:translateY(-40px) rotate(-1deg);opacity:0}to{transform:translateY(0) rotate(0);opacity:1}}
    @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
    @keyframes gentleFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
    @keyframes timerPulse{0%,100%{color:#ff6b6b}50%{color:#ff0}}
    body{margin:0;overflow-x:hidden}`;
    document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);

  const C={parchment:"#F5ECD7",parchDark:"#E8DCBE",navy:"#1B2A4A",navyLight:"#2C3E6B",red:"#9B2335",redLight:"#C4463A",gold:"#C9A84C",goldLight:"#E0C878",green:"#2D6A4F",greenLight:"#40916C",ink:"#1A1A2E",inkLight:"#3D3D5C",cream:"#FFF8E7",manila:"#E8D5A3"};
  const paperBg={background:`linear-gradient(135deg,${C.parchment} 0%,${C.cream} 50%,${C.parchDark} 100%)`,boxShadow:"0 4px 24px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.5)"};

  // Timer
  useEffect(()=>{
    if(screen==="play"&&TIME_LIMIT>0){
      setTimeLeft(TIME_LIMIT);
      timerRef.current=setInterval(()=>{setTimeLeft(p=>{if(p<=1){clearInterval(timerRef.current);return 0;}return p-1;});},1000);
      return()=>clearInterval(timerRef.current);
    }
  },[screen,round,TIME_LIMIT]);

  const autoSubmitRef=useRef(false);
  const timerStartedRef=useRef(false);
  useEffect(()=>{
    if(screen==="play"&&TIME_LIMIT>0&&timeLeft>0)timerStartedRef.current=true;
    if(timeLeft===0&&TIME_LIMIT>0&&screen==="play"&&timerStartedRef.current&&!autoSubmitRef.current){
      autoSubmitRef.current=true;
      resolveRound();
    }
    if(screen!=="play"){autoSubmitRef.current=false;timerStartedRef.current=false;}
  },[timeLeft,screen]);

  // Game logic
  const startGame=useCallback((diff)=>{
    setDifficulty(diff);
    const rounds=diff==="junior"?5:diff==="attaché"?7:9;
    const handSize=12;
    const easy=shuffle(ALL_CRISES.filter(c=>c.difficulty===1));
    const med=shuffle(ALL_CRISES.filter(c=>c.difficulty===2));
    const hard=shuffle(ALL_CRISES.filter(c=>c.difficulty>=3));
    let crises;
    if(diff==="junior")crises=[...easy.slice(0,3),...med.slice(0,2)];
    else if(diff==="attaché")crises=[...easy.slice(0,2),...med.slice(0,3),...hard.slice(0,2)];
    else crises=[...easy.slice(0,1),...med.slice(0,3),...hard.slice(0,5)];
    crises=shuffle(crises).slice(0,rounds);
    // Guarantee solvability: for EACH crisis, ensure at least 1 card per req in pool
    const allC=shuffle([...ALL_COUNTRIES]);
    let guaranteed=[];
    crises.forEach(cr=>{cr.requirements.forEach(req=>{const m=allC.find(c=>matchesReq(c,req)&&!guaranteed.find(g=>g.n===c.n));if(m)guaranteed.push(m);});});
    const gSet=new Set(guaranteed.map(c=>c.n));
    const rest=allC.filter(c=>!gSet.has(c.n));
    const pool=shuffle([...guaranteed,...rest]);
    setDeck(pool.slice(handSize));
    setHand(pool.slice(0,handSize));
    setCrisisQueue(crises);setRound(0);setScore(0);setTotalSeals(0);
    setHints(diff==="junior"?5:diff==="attaché"?3:2);
    setDispatches(diff==="junior"?5:diff==="attaché"?3:2);
    setAssignments({});setRoundResults([]);setResolveResult(null);
    setStreak(0);setBestStreak(0);setRevealedSlots(new Set());setScreen("briefing");
  },[]);

  const currentCrisis=crisisQueue[round];

  const startRound=useCallback(()=>{setAssignments({});setResolveResult(null);setStampAnim(false);setDossierCountry(null);setRevealedSlots(new Set());setDispatchOpen(false);setDispatchOptions([]);setSwapTarget(null);if(TIME_LIMIT>0)setTimeLeft(TIME_LIMIT);autoSubmitRef.current=false;setScreen("play");},[TIME_LIMIT]);

  const assignToReq=useCallback((ri,ci)=>{setAssignments(p=>{const n={...p};Object.keys(n).forEach(k=>{if(n[k]===ci)delete n[k];});n[ri]=ci;return n;});},[]);
  const unassign=useCallback((ri)=>{setAssignments(p=>{const n={...p};delete n[ri];return n;});setRevealedSlots(p=>{const n=new Set(p);n.delete(ri);return n;});},[]);

  const useHint=useCallback((ri)=>{
    if(hints<=0||assignments[ri]===undefined)return;
    setHints(p=>p-1);
    setRevealedSlots(p=>new Set(p).add(ri));
  },[hints,assignments]);

  const openDispatch=useCallback((region)=>{
    if(dispatches<=0)return;
    const inHand=new Set(hand.map(c=>c.n));
    const available=deck.filter(c=>c.r===region&&!inHand.has(c.n));
    const picks=shuffle(available).slice(0,3);
    if(picks.length===0)return;
    setDispatchOptions(picks);
  },[dispatches,hand,deck]);

  const confirmDispatch=useCallback((pickedCountry)=>{
    if(swapTarget===null)return;
    setDispatches(p=>p-1);
    const nh=[...hand];const nd=[...deck];
    // Remove picked from deck
    const di=nd.findIndex(c=>c.n===pickedCountry.n);
    if(di>=0)nd.splice(di,1);
    // Put swapped-out card back in deck
    nd.push(nh[swapTarget]);
    nh[swapTarget]=pickedCountry;
    // Clear assignments referencing swapped slot
    setAssignments(p=>{const n={...p};Object.keys(n).forEach(k=>{if(Number(n[k])===swapTarget)delete n[k];});return n;});
    setHand(nh);setDeck(nd);setDispatchOpen(false);setDispatchOptions([]);setSwapTarget(null);
  },[hand,deck,swapTarget]);

  const resolveRound=useCallback(()=>{
    if(!currentCrisis)return;
    clearInterval(timerRef.current);
    const reqs=currentCrisis.requirements;
    let matched=0;const details=[];
    reqs.forEach((req,ri)=>{const ci=assignments[ri];if(ci!==undefined){const co=hand[ci];const m=matchesReq(co,req);if(m)matched++;details.push({req,country:co,isMatch:m});}else details.push({req,country:null,isMatch:false});});
    const success=matched===reqs.length;
    const sealsEarned=success?currentCrisis.seals:0;
    const newStreak=success?streak+1:0;
    const streakBonus=success&&newStreak>=3?newStreak*50:0;
    const timeBonus=success&&TIME_LIMIT>0?Math.floor(timeLeft*2):0;
    const roundScore=(sealsEarned*100)+streakBonus+timeBonus;
    setResolveResult({success,matched,total:reqs.length,sealsEarned,roundScore,details,streakBonus,timeBonus,newStreak});
    setTotalSeals(p=>p+sealsEarned);setScore(p=>p+roundScore);setStreak(newStreak);
    if(newStreak>bestStreak)setBestStreak(newStreak);
    setRoundResults(p=>[...p,{crisis:currentCrisis.title,success,sealsEarned,roundScore}]);
    setStampAnim(true);setScreen("resolve");
  },[currentCrisis,assignments,hand,streak,bestStreak,timeLeft,TIME_LIMIT]);

  const nextRound=useCallback(()=>{
    if(round>=crisisQueue.length-1){setScreen("report");return;}
    // Refresh: swap 3 random cards, then guarantee solvability for next crisis
    const nh=[...hand],nd=[...deck];
    const sw=Math.min(3,nd.length);
    const idx=shuffle([...Array(nh.length).keys()]).slice(0,sw);
    idx.forEach(i=>{if(nd.length>0){const o=nh[i];nh[i]=nd.pop();nd.unshift(o);}});
    // Guarantee: ensure at least one card per requirement of next crisis
    const nextCrisis=crisisQueue[round+1];
    if(nextCrisis){
      nextCrisis.requirements.forEach(req=>{
        const hasMatch=nh.some(c=>matchesReq(c,req));
        if(!hasMatch){
          const di=nd.findIndex(c=>matchesReq(c,req));
          if(di>=0){
            const ri=Math.floor(Math.random()*nh.length);
            nd.push(nh[ri]);nh[ri]=nd[di];nd.splice(di,1);
          }
        }
      });
    }
    setHand(nh);setDeck(nd);setRound(p=>p+1);setAssignments({});setResolveResult(null);setStampAnim(false);setScreen("briefing");
  },[round,crisisQueue,hand,deck]);



  useEffect(()=>{
    if(screen==="briefing"&&currentCrisis){
      setTypewriterText("");setTypewriterDone(false);
      const t=currentCrisis.brief;let i=0;
      const iv=setInterval(()=>{i++;setTypewriterText(t.slice(0,i));if(i>=t.length){clearInterval(iv);setTypewriterDone(true);}},20);
      return()=>clearInterval(iv);
    }
  },[screen,round,currentCrisis]);

  // Sub components
  const WaxSeal=({size=48,color="#8B2500",text="✦"})=>(<div style={{width:size,height:size,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%,${color}dd,${color}88,${color})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`inset 0 -2px 4px rgba(0,0,0,0.4),inset 0 2px 4px rgba(255,255,255,0.15),0 2px 8px rgba(0,0,0,0.3)`,color:"#fff",fontSize:size*.4,fontWeight:"bold",border:`2px solid ${color}66`,flexShrink:0}}>{text}</div>);
  const Stamp=({text,color=C.green,rot=-8,big=false})=>(<div style={{display:"inline-block",transform:`rotate(${rot}deg)`,border:`${big?4:3}px solid ${color}`,borderRadius:4,padding:big?"14px 28px":"6px 14px",color,fontFamily:"'Special Elite',monospace",fontSize:big?28:14,fontWeight:"bold",letterSpacing:3,textTransform:"uppercase",opacity:.85,position:"relative"}}>{text}<div style={{position:"absolute",inset:2,border:`1px solid ${color}44`,borderRadius:2}}/></div>);
  const Redacted=()=>(<span style={{background:C.ink,color:C.ink,padding:"1px 6px",borderRadius:2,cursor:"default",userSelect:"none",fontFamily:"'Special Elite',monospace",fontSize:10,letterSpacing:1}}>CLASSIFIED</span>);
  const Btn=({children,onClick,disabled,primary})=>(<div onClick={disabled?undefined:onClick} style={{display:"inline-block",padding:"12px 28px",cursor:disabled?"not-allowed":"pointer",background:disabled?"#555":primary?`linear-gradient(135deg,${C.gold},${C.goldLight})`:C.navy,color:disabled?"#999":primary?C.navy:C.cream,fontFamily:"'Special Elite',monospace",fontSize:15,letterSpacing:3,textTransform:"uppercase",transition:"all 0.2s",opacity:disabled?.5:1,boxShadow:disabled?"none":"0 3px 12px rgba(0,0,0,0.3)"}}>{children}</div>);

  // Dossier overlay
  const DossierPanel=({country,onClose})=>{
    if(!country)return null;
    return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{...paperBg,maxWidth:400,width:"100%",padding:"24px 20px",position:"relative",animation:"paperSlide 0.3s ease-out"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.red,letterSpacing:3}}>🔍 INTELLIGENCE DOSSIER</div>
          <div onClick={onClose} style={{cursor:"pointer",fontSize:18,color:C.inkLight}}>✕</div>
        </div>
        <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:14}}>
          <span style={{fontSize:44}}>{country.f}</span>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:C.navy}}>{country.n}</div>
            <div style={{fontFamily:"'Source Serif 4',serif",fontSize:13,color:C.inkLight}}>Capital: <strong>{country.c}</strong></div>
          </div>
        </div>
        <div style={{padding:"6px 10px",background:REGION_COLORS[country.r]||C.navy,color:"#fff",fontFamily:"'Special Elite',monospace",fontSize:12,marginBottom:10,display:"inline-block",borderRadius:2}}>📍 {country.r}</div>
        <div style={{marginBottom:10}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.navy,letterSpacing:2,marginBottom:5}}>TRAITS:</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
            {country.t.map((t,i)=>(<span key={i} style={{fontFamily:"'Special Elite',monospace",fontSize:12,padding:"2px 7px",background:`${C.gold}22`,border:`1px solid ${C.gold}44`,color:C.navy}}>{TRAIT_ICONS[t]||""} {t}</span>))}
          </div>
        </div>
        {country.b.length>0&&<div>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.navy,letterSpacing:2,marginBottom:5}}>BORDERS:</div>
          <div style={{fontFamily:"'Source Serif 4',serif",fontSize:12,color:C.inkLight,lineHeight:1.5}}>{country.b.join(", ")}</div>
        </div>}
      </div>
    </div>);
  };

  // ═══ TITLE ═══
  if(screen==="title"){
    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#0F1B33 40%,#162544 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",overflow:"hidden",position:"relative",padding:20}}>
      <div onClick={()=>navigate("/")} style={{position:"absolute",top:12,left:16,color:"#8a8aaa",fontSize:12,cursor:"pointer",zIndex:10,padding:"6px 12px",borderRadius:6,background:"rgba(10,15,30,0.6)",border:"1px solid #2a2a4a",fontFamily:"'Courier New',monospace",letterSpacing:2}}>← ARCADE</div>
      <div style={{position:"absolute",inset:0,opacity:.03,backgroundImage:`repeating-linear-gradient(0deg,transparent,transparent 50px,#fff 50px,#fff 51px),repeating-linear-gradient(90deg,transparent,transparent 50px,#fff 50px,#fff 51px)`}}/>
      {[...Array(5)].map((_,i)=>(<div key={i} style={{position:"absolute",top:`${10+i*18}%`,left:`${5+(i%3)*35}%`,opacity:.06,animation:`gentleFloat ${3+i*.5}s ease-in-out infinite`,animationDelay:`${i*.8}s`}}><WaxSeal size={30+i*8} color={i%2===0?C.gold:C.red} text={["✦","⚜","✧","❋","✦"][i]}/></div>))}
      <div style={{textAlign:"center",position:"relative",zIndex:2,animation:"fadeUp 1s ease-out"}}>
        <div style={{width:100,height:100,borderRadius:"50%",margin:"0 auto 20px",background:`radial-gradient(circle at 35% 35%,${C.gold},${C.goldLight}88,${C.gold}cc)`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 40px ${C.gold}33`,border:`3px solid ${C.goldLight}`,animation:"sealPulse 4s ease-in-out infinite"}}><div style={{fontSize:40}}>🏛️</div></div>
        <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.goldLight,letterSpacing:8,textTransform:"uppercase",marginBottom:8,opacity:.7}}>The Honourable Office of</div>
        <h1 style={{fontSize:"clamp(32px,7vw,64px)",color:C.cream,margin:"0 0 4px",fontWeight:900,lineHeight:1.05,textShadow:`0 2px 20px ${C.navy}`}}>Embassy of<br/><span style={{color:C.gold,fontStyle:"italic"}}>Oddballs</span></h1>
        <div style={{width:180,height:2,margin:"14px auto",background:`linear-gradient(90deg,transparent,${C.gold}88,transparent)`}}/>
        <p style={{fontFamily:"'Source Serif 4',serif",fontSize:15,color:C.goldLight,maxWidth:440,margin:"0 auto 28px",lineHeight:1.7,fontWeight:300,opacity:.8,padding:"0 16px"}}>
          Absurd crises demand absurd diplomacy. Match real countries to solve ridiculous problems. Learn the world — one oddball crisis at a time.
        </p>
        <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.cream,letterSpacing:3,marginBottom:14,opacity:.5}}>SELECT CLEARANCE LEVEL</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:16,padding:"0 8px"}}>
          {[
            {id:"junior",label:"Junior Clerk",desc:"Full info • 5 crises • No timer • 5 dispatches",color:C.greenLight,emoji:"📋"},
            {id:"attaché",label:"Attaché",desc:"Info redacted mid-game • 7 crises • 90s timer • 3 dispatches",color:C.gold,emoji:"📁"},
            {id:"ambassador",label:"Ambassador",desc:"Minimal info • 9 crises • 60s timer • 2 dispatches",color:C.redLight,emoji:"🔒"},
          ].map(d=>(<div key={d.id} onClick={()=>startGame(d.id)}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=d.color;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=`${d.color}44`;}}
            style={{padding:"14px 16px",width:170,textAlign:"center",cursor:"pointer",background:`${d.color}11`,border:`2px solid ${d.color}44`,transition:"all 0.3s",borderRadius:4}}>
            <div style={{fontSize:26,marginBottom:4}}>{d.emoji}</div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:d.color,marginBottom:4}}>{d.label}</div>
            <div style={{fontFamily:"'Source Serif 4',serif",fontSize:11,color:C.goldLight,lineHeight:1.4,opacity:.7}}>{d.desc}</div>
          </div>))}
        </div>
        <div onClick={()=>setScreen("howto")} style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.goldLight,cursor:"pointer",opacity:.5,letterSpacing:2,textDecoration:"underline"}}>How to Play</div>
        <div style={{marginTop:16,fontFamily:"'Special Elite',monospace",fontSize:9,color:C.goldLight,opacity:.3,letterSpacing:3}}>ALL 193 UN MEMBER STATES • FORM 7B-ODDBALL</div>
      </div>
    </div>);
  }

  // ═══ HOW TO PLAY ═══
  if(screen==="howto"){
    const steps=[
      {i:"📜",t:"Read the Crisis",d:"Each round presents an absurd international problem. Read it carefully — the solution depends on the details."},
      {i:"🔍",t:"Check Requirements",d:"Every crisis needs specific types of countries: a coastal nation, an African nation, a coffee-producing nation, etc."},
      {i:"🃏",t:"Assign Countries",d:"Click a country card from your hand to fill the next empty requirement slot. The country must actually match — right region, right traits."},
      {i:"🧠",t:"Knowledge Matters",d:"At higher difficulties, card info gets REDACTED. You'll need to know your geography! Use the 🔍 dossier button on any card to study it."},
      {i:"✈️",t:"Dispatch & Hints",d:"Stuck? Use a Dispatch to request a card from a specific region — you pick the region, so knowing your geography helps! Use Hints to check one assignment before submitting."},
      {i:"🏅",t:"Earn Seals",d:"Fully solve crises for Seals. Build streaks for bonuses. Beat the clock at higher levels. Aim for Grand Ambassador!"},
    ];
    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#0F1B33 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{...paperBg,maxWidth:560,width:"100%",padding:"28px 24px",animation:"paperSlide 0.5s ease-out"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,fontWeight:900,color:C.navy,marginBottom:4,textAlign:"center"}}>How to Play</div>
        <div style={{width:80,height:2,margin:"0 auto 20px",background:`linear-gradient(90deg,transparent,${C.navy}66,transparent)`}}/>
        {steps.map((s,i)=>(<div key={i} style={{display:"flex",gap:12,marginBottom:14}}>
          <div style={{fontSize:24,flexShrink:0,width:32,textAlign:"center"}}>{s.i}</div>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:C.navy,marginBottom:2}}>{s.t}</div>
          <div style={{fontFamily:"'Source Serif 4',serif",fontSize:13,color:C.inkLight,lineHeight:1.5}}>{s.d}</div></div>
        </div>))}
        <div style={{textAlign:"center",marginTop:16}}><Btn primary onClick={()=>setScreen("title")}>Back to Lobby</Btn></div>
      </div>
    </div>);
  }

  // ═══ BRIEFING ═══
  if(screen==="briefing"){
    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#0F1B33 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Source Serif 4',serif",padding:20}}>
      <div style={{...paperBg,maxWidth:560,width:"100%",padding:"32px 26px",animation:"paperSlide 0.6s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,borderBottom:`2px solid ${C.navy}22`,paddingBottom:8}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.red,letterSpacing:4}}>⚠ CLASSIFIED</div>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.inkLight,letterSpacing:2}}>CRISIS {round+1}/{crisisQueue.length}</div>
        </div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(18px,4vw,26px)",color:C.navy,margin:"0 0 4px",fontWeight:900,lineHeight:1.2}}>{currentCrisis?.title}</h2>
        <div style={{display:"flex",gap:5,marginBottom:14,alignItems:"center"}}>
          {[...Array(currentCrisis?.difficulty||1)].map((_,i)=>(<WaxSeal key={i} size={16} color={C.red} text="!"/>))}
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.inkLight,marginLeft:4}}>SEV. {currentCrisis?.difficulty} • {currentCrisis?.seals} SEAL{currentCrisis?.seals>1?"S":""}</span>
          {infoLevel!=="full"&&<span style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.red,marginLeft:"auto"}}>🔒 {infoLevel==="partial"?"TRAITS REDACTED":"MINIMAL INTEL"}</span>}
        </div>
        <div style={{background:C.cream,padding:"14px 16px",border:`1px solid ${C.manila}`,marginBottom:18,minHeight:60}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:9,color:C.inkLight,letterSpacing:3,opacity:.4,marginBottom:8}}>DIPLOMATIC CABLE</div>
          <p style={{fontFamily:"'Special Elite',monospace",fontSize:14,color:C.ink,lineHeight:1.7,margin:0}}>{typewriterText}{!typewriterDone&&<span style={{animation:"blink 0.8s step-end infinite"}}>▌</span>}</p>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.navy,letterSpacing:3,marginBottom:6}}>COALITION REQUIRED:</div>
          {currentCrisis?.requirements.map((req,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<currentCrisis.requirements.length-1?`1px dashed ${C.manila}`:"none"}}>
            <div style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${C.navy}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Special Elite',monospace",fontSize:10,color:C.navy,flexShrink:0}}>{i+1}</div>
            <span style={{fontFamily:"'Source Serif 4',serif",fontSize:13,color:C.inkLight}}>{req.label}</span>
          </div>))}
        </div>
        {TIME_LIMIT>0&&<div style={{background:`${C.red}11`,border:`1px solid ${C.red}33`,padding:"6px 10px",marginBottom:14,fontFamily:"'Special Elite',monospace",fontSize:12,color:C.red,letterSpacing:2}}>⏱ TIME LIMIT: {TIME_LIMIT}s</div>}
        <div style={{textAlign:"center"}}><Btn onClick={startRound}>Accept Mission →</Btn></div>
      </div>
    </div>);
  }

  // ═══ PLAY ═══
  if(screen==="play"){
    const allAssigned=currentCrisis?.requirements.every((_,i)=>assignments[i]!==undefined);
    const showTraits=infoLevel==="full";
    const showRegion=infoLevel!=="minimal";
    const showCapital=infoLevel!=="minimal";

    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,#1a1a2e 0%,${C.navy} 50%,#0d1b2a 100%)`,fontFamily:"'Source Serif 4',serif",padding:"10px",display:"flex",flexDirection:"column"}}>
      {dossierCountry&&<DossierPanel country={dossierCountry} onClose={()=>setDossierCountry(null)}/>}

      {/* Top bar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 8px",marginBottom:8,background:`${C.navy}cc`,borderBottom:`1px solid ${C.gold}33`,flexWrap:"wrap",gap:4}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(12px,2.5vw,16px)",color:C.gold,fontWeight:700,flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>Crisis {round+1}: {currentCrisis?.title}</div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
          {TIME_LIMIT>0&&<span style={{fontFamily:"'Special Elite',monospace",fontSize:14,color:timeLeft<=15?C.red:C.cream,fontWeight:"bold",animation:timeLeft<=10?"timerPulse 1s infinite":"none"}}>⏱ {timeLeft}s</span>}
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.goldLight}}>🏅{totalSeals}</span>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.cream}}>💡{hints}</span>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.cream}}>✈{dispatches}</span>
          {streak>=2&&<span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:"#ff6"}}>🔥{streak}</span>}
        </div>
      </div>

      <div style={{display:"flex",gap:10,flex:1,flexDirection:"column",maxWidth:960,margin:"0 auto",width:"100%"}}>
        {/* Requirements */}
        <div style={{...paperBg,padding:"10px 14px"}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.navy,letterSpacing:3,marginBottom:6}}>ASSIGN NATIONS TO ROLES <span style={{color:C.inkLight,opacity:.5,letterSpacing:1}}>— click a card to fill next empty slot</span></div>
          {currentCrisis?.requirements.map((req,ri)=>{
            const ci=assignments[ri];const co=ci!==undefined?hand[ci]:null;
            const isRevealed=revealedSlots.has(ri);
            const revealMatch=isRevealed&&co?matchesReq(co,req):null;
            return(<div key={ri} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",marginBottom:3,background:isRevealed?(revealMatch?`${C.green}12`:`${C.red}12`):co?C.cream:`${C.cream}88`,border:`2px solid ${isRevealed?(revealMatch?C.green:C.red):co?C.manila+"88":C.manila+"44"}`,transition:"all 0.2s",flexWrap:"wrap"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:isRevealed?(revealMatch?C.green:C.redLight):C.navy,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontFamily:"'Special Elite',monospace",flexShrink:0}}>
                {isRevealed?(revealMatch?"✓":"✗"):ri+1}
              </div>
              <span style={{fontFamily:"'Source Serif 4',serif",fontSize:13,color:C.inkLight,flex:1,minWidth:80}}>{req.label}</span>
              {co?(<div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 8px",background:"#fff",border:`1px solid ${C.manila}`,fontFamily:"'Special Elite',monospace",fontSize:12}}>
                <span>{co.f}</span><span>{co.n}</span>
                <span onClick={()=>unassign(ri)} style={{cursor:"pointer",color:C.red,marginLeft:4,fontSize:14}}>×</span>
              </div>):(<span style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight,opacity:.4}}>← assign a country</span>)}
              {co&&!isRevealed&&hints>0&&(<div onClick={e=>{e.stopPropagation();useHint(ri);}} style={{padding:"2px 6px",background:`${C.gold}22`,border:`1px solid ${C.gold}44`,fontFamily:"'Special Elite',monospace",fontSize:9,color:C.gold,cursor:"pointer",letterSpacing:1,whiteSpace:"nowrap"}}>💡 CHECK</div>)}
            </div>);
          })}
        </div>

        {/* Hand */}
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,flexWrap:"wrap",gap:4}}>
            <span style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.goldLight,letterSpacing:2}}>
              YOUR DELEGATION ({hand.length})
              {infoLevel!=="full"&&<span style={{color:C.red,marginLeft:6,fontSize:10}}>🔒 click 🔍 on cards for full dossier</span>}
            </span>
            <div onClick={()=>{if(dispatches>0)setDispatchOpen(true);}} style={{padding:"2px 8px",background:`${C.gold}22`,border:`1px solid ${C.gold}44`,cursor:dispatches>0?"pointer":"not-allowed",fontFamily:"'Special Elite',monospace",fontSize:10,color:dispatches>0?C.goldLight:"#666",letterSpacing:2,opacity:dispatches>0?1:.4}}>✈ DISPATCH ({dispatches})</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(145px,1fr))",gap:6}}>
            {hand.map((co,idx)=>{
              const isAss=Object.values(assignments).includes(idx);
              const unfilled=currentCrisis?.requirements.map((_,ri)=>ri).filter(ri=>assignments[ri]===undefined)||[];
              const isHov=hoverCard===idx&&!isAss;
              return(<div key={idx} style={{position:"relative"}}>
                <div onClick={()=>{if(!isAss&&unfilled.length>0)assignToReq(unfilled[0],idx);}}
                  onMouseEnter={()=>setHoverCard(idx)} onMouseLeave={()=>setHoverCard(null)}
                  style={{...paperBg,padding:"8px 10px",cursor:isAss?"default":"pointer",border:`2px solid ${isAss?C.green+"88":C.manila}`,transition:"all 0.2s",transform:isHov?"translateY(-3px)":"none",boxShadow:isHov?"0 6px 20px rgba(0,0,0,0.2)":"0 2px 6px rgba(0,0,0,0.1)",opacity:isAss?.45:1,position:"relative"}}>
                  {isAss&&<div style={{position:"absolute",top:2,right:2,background:C.green,color:"#fff",width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:"bold",zIndex:2}}>✓</div>}
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:showTraits?4:2}}>
                    <span style={{fontSize:22,flexShrink:0}}>{co.f}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:C.navy,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.n}</div>
                      {showCapital?<div style={{fontFamily:"'Special Elite',monospace",fontSize:9,color:C.inkLight,opacity:.6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{co.c}</div>:<Redacted/>}
                    </div>
                  </div>
                  {showRegion?<div style={{fontFamily:"'Special Elite',monospace",fontSize:9,color:"#fff",padding:"1px 5px",background:REGION_COLORS[co.r]||C.navy,borderRadius:2,marginBottom:showTraits?3:0,display:"inline-block"}}>📍 {co.r}</div>:<div style={{marginBottom:showTraits?3:0}}><Redacted/></div>}
                  {showTraits?<div style={{display:"flex",flexWrap:"wrap",gap:2,marginTop:1}}>
                    {co.t.map((t,ti)=>(<span key={ti} style={{fontFamily:"'Special Elite',monospace",fontSize:8,padding:"1px 4px",background:`${C.gold}18`,color:C.navy,border:`1px solid ${C.gold}33`,textTransform:"uppercase",letterSpacing:1,whiteSpace:"nowrap"}}>{TRAIT_ICONS[t]||""}{t}</span>))}
                  </div>:infoLevel==="partial"?<div style={{marginTop:1}}><Redacted/></div>:null}
                </div>
                <div onClick={e=>{e.stopPropagation();setDossierCountry(co);}} style={{position:"absolute",bottom:3,right:3,width:18,height:18,borderRadius:"50%",background:`${C.navy}33`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,opacity:.5,transition:"opacity 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.opacity="1";}} onMouseLeave={e=>{e.currentTarget.style.opacity=".5";}}>🔍</div>
              </div>);
            })}
          </div>
        </div>

        {/* Dispatch overlay */}
        {dispatchOpen&&(<div style={{...paperBg,padding:"12px 16px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.navy,letterSpacing:2}}>✈ DISPATCH — Pick a region to request a card from</div>
            <div onClick={()=>{setDispatchOpen(false);setDispatchOptions([]);setSwapTarget(null);}} style={{cursor:"pointer",fontSize:16,color:C.inkLight}}>✕</div>
          </div>
          {dispatchOptions.length===0?(<div>
            <div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight,marginBottom:8}}>Which region do you need?</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {["Europe","Asia","Middle East","Africa","North America","Central America","Caribbean","South America","Oceania"].map(r=>(<div key={r} onClick={()=>openDispatch(r)} style={{padding:"4px 10px",background:REGION_COLORS[r]||C.navy,color:"#fff",fontFamily:"'Special Elite',monospace",fontSize:10,cursor:"pointer",borderRadius:2,letterSpacing:1}}>{r}</div>))}
            </div>
          </div>):(<div>
            {swapTarget===null?(<div>
              <div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight,marginBottom:6}}>First, click a card in your hand to REPLACE:</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {hand.map((co,i)=>(<div key={i} onClick={()=>setSwapTarget(i)} style={{padding:"4px 8px",background:C.cream,border:`1px solid ${C.manila}`,cursor:"pointer",fontFamily:"'Special Elite',monospace",fontSize:11,display:"flex",gap:4,alignItems:"center"}}><span>{co.f}</span><span>{co.n}</span></div>))}
              </div>
            </div>):(<div>
              <div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight,marginBottom:6}}>Replacing <strong>{hand[swapTarget]?.f} {hand[swapTarget]?.n}</strong> — pick a new card:</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {dispatchOptions.map((co,i)=>(<div key={i} onClick={()=>confirmDispatch(co)} style={{...paperBg,padding:"8px 10px",cursor:"pointer",border:`2px solid ${C.gold}44`,minWidth:120}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><span style={{fontSize:22}}>{co.f}</span><div><div style={{fontFamily:"'Playfair Display',serif",fontSize:13,fontWeight:700,color:C.navy}}>{co.n}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:9,color:C.inkLight}}>{co.c}</div></div></div>
                  <div style={{fontFamily:"'Special Elite',monospace",fontSize:8,color:"#fff",padding:"1px 4px",background:REGION_COLORS[co.r]||C.navy,borderRadius:2,display:"inline-block",marginBottom:2}}>📍 {co.r}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:2}}>{co.t.map((t,ti)=>(<span key={ti} style={{fontFamily:"'Special Elite',monospace",fontSize:7,padding:"0 3px",background:`${C.gold}18`,color:C.navy,border:`1px solid ${C.gold}33`,textTransform:"uppercase"}}>{TRAIT_ICONS[t]||""}{t}</span>))}</div>
                </div>))}
              </div>
            </div>)}
          </div>)}
        </div>)}

        <div style={{display:"flex",justifyContent:"center",padding:"8px 0"}}><Btn onClick={allAssigned?resolveRound:undefined} disabled={!allAssigned} primary={allAssigned}>Submit Coalition ✦</Btn></div>
      </div>
    </div>);
  }

  // ═══ RESOLVE ═══
  if(screen==="resolve"&&resolveResult){
    const{success,matched,total,sealsEarned,roundScore,details,streakBonus,timeBonus,newStreak}=resolveResult;
    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#0F1B33 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Source Serif 4',serif",padding:20}}>
      <div style={{...paperBg,maxWidth:520,width:"100%",padding:"32px 26px",textAlign:"center",animation:"paperSlide 0.5s ease-out"}}>
        <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.inkLight,letterSpacing:4,marginBottom:14}}>RESOLUTION • CRISIS {round+1}</div>
        <div style={{margin:"12px auto 20px",animation:stampAnim?"stampSlam 0.5s ease-out forwards":"none"}}><Stamp text={success?"RESOLVED":"UNRESOLVED"} color={success?C.green:C.red} rot={success?-8:-5} big/></div>

        <div style={{textAlign:"left",background:C.cream,padding:"12px 14px",border:`1px solid ${C.manila}`,marginBottom:18}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.navy,letterSpacing:2,marginBottom:6}}>REVIEW:</div>
          {details?.map((d,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 0",borderBottom:i<details.length-1?`1px dashed ${C.manila}`:"none"}}>
            <span style={{color:d.isMatch?C.green:C.red,fontSize:14,flexShrink:0}}>{d.isMatch?"✓":"✗"}</span>
            <span style={{fontFamily:"'Source Serif 4',serif",fontSize:12,color:C.inkLight,flex:1}}>{d.req.label}</span>
            <span style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:d.isMatch?C.green:C.red}}>{d.country?`${d.country.f} ${d.country.n}`:"—"}</span>
          </div>))}
          {!success&&details?.some(d=>!d.isMatch&&d.country)&&(
            <div style={{marginTop:8,padding:"6px",background:`${C.gold}11`,border:`1px solid ${C.gold}33`,fontFamily:"'Source Serif 4',serif",fontSize:11,color:C.inkLight,lineHeight:1.5}}>
              💡 <strong>Learn:</strong> {details.filter(d=>!d.isMatch&&d.country).map(d=>`${d.country.n} is ${d.country.r}, traits: ${d.country.t.join(", ")}`).join(". ")}
            </div>
          )}
        </div>

        <div style={{display:"flex",justifyContent:"center",gap:16,marginBottom:16,flexWrap:"wrap"}}>
          <div style={{textAlign:"center"}}><div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:3}}>{sealsEarned>0?[...Array(sealsEarned)].map((_,i)=>(<WaxSeal key={i} size={20} color={C.gold} text="★"/>)):<WaxSeal size={20} color="#888" text="—"/>}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight}}>{sealsEarned} Seal{sealsEarned!==1?"s":""}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:C.gold,fontWeight:900}}>+{roundScore}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight}}>Points</div></div>
          {newStreak>=2&&<div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#ff6",fontWeight:900}}>🔥{newStreak}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight}}>Streak{streakBonus>0?` +${streakBonus}`:""}</div></div>}
          {timeBonus>0&&<div style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:C.greenLight,fontWeight:900}}>⏱+{timeBonus}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight}}>Time</div></div>}
        </div>

        <div style={{display:"flex",justifyContent:"center",gap:20,padding:"8px",background:`${C.navy}08`,border:`1px solid ${C.navy}11`,marginBottom:16}}>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.navy}}>Score: <strong>{score}</strong></span>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.navy}}>Seals: <strong>{totalSeals}</strong></span>
        </div>
        <Btn onClick={nextRound}>{round>=crisisQueue.length-1?"View Report →":"Next Crisis →"}</Btn>
      </div>
    </div>);
  }

  // ═══ FINAL REPORT ═══
  if(screen==="report"){
    const maxS=crisisQueue.reduce((s,c)=>s+c.seals,0);
    const pct=maxS>0?totalSeals/maxS:0;
    const rating=pct>=.9?"GRAND AMBASSADOR":pct>=.7?"SENIOR DIPLOMAT":pct>=.4?"JUNIOR ATTACHÉ":"INTERN (UNPAID)";
    const rc=pct>=.9?C.gold:pct>=.7?C.green:pct>=.4?C.navy:C.red;
    const solved=roundResults.filter(r=>r.success).length;
    return(<div style={{minHeight:"100vh",background:`linear-gradient(160deg,${C.navy} 0%,#0F1B33 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Source Serif 4',serif",padding:20}}>
      <div style={{...paperBg,maxWidth:540,width:"100%",padding:"32px 26px",animation:"paperSlide 0.6s ease-out"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.red,letterSpacing:4,marginBottom:10}}>⚠ FINAL ASSESSMENT ⚠</div>
          <WaxSeal size={56} color={rc} text="✦"/>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.navy,margin:"10px 0 2px",fontWeight:900}}>{rating}</h2>
          <div style={{fontFamily:"'Special Elite',monospace",fontSize:12,color:C.inkLight}}>Level: <strong style={{color:C.gold}}>{difficulty.toUpperCase()}</strong> • Score: <strong style={{color:C.gold,fontSize:16}}>{score}</strong></div>
        </div>
        <div style={{width:"80%",height:2,margin:"0 auto 16px",background:`linear-gradient(90deg,transparent,${C.navy}44,transparent)`}}/>
        {roundResults.map((rr,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 8px",borderBottom:i<roundResults.length-1?`1px dashed ${C.manila}`:"none"}}>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:10,color:C.inkLight,width:14,flexShrink:0}}>{i+1}.</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:12,color:C.navy,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{rr.crisis}</span>
          <Stamp text={rr.success?"✓":"✗"} color={rr.success?C.green:C.red} rot={rr.success?-5:3}/>
          <span style={{fontFamily:"'Special Elite',monospace",fontSize:11,color:C.gold,width:36,textAlign:"right"}}>+{rr.roundScore}</span>
        </div>))}
        <div style={{display:"flex",justifyContent:"center",gap:16,padding:"12px",background:`${C.navy}08`,border:`1px solid ${C.navy}11`,marginTop:14,marginBottom:16,flexWrap:"wrap"}}>
          {[{v:totalSeals,l:"SEALS",c:C.gold},{v:`${solved}/${roundResults.length}`,l:"RESOLVED",c:C.navy},{v:bestStreak,l:"BEST STREAK",c:"#ff6"},{v:hints,l:"HINTS LEFT",c:C.green}].map((s,i)=>(<div key={i} style={{textAlign:"center"}}><div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:s.c,fontWeight:900}}>{s.v}</div><div style={{fontFamily:"'Special Elite',monospace",fontSize:9,color:C.inkLight,letterSpacing:2}}>{s.l}</div></div>))}
        </div>
        <div style={{textAlign:"center",marginBottom:14}}><Stamp text="SESSION COMPLETE" color={C.navy} rot={-3}/></div>
        <div style={{textAlign:"center"}}><Btn primary onClick={()=>setScreen("title")}>New Session</Btn></div>
        <div style={{marginTop:12,textAlign:"center",fontFamily:"'Special Elite',monospace",fontSize:9,color:C.inkLight,opacity:.4,letterSpacing:2}}>EMBASSY OF ODDBALLS • 193 NATIONS • FORM 12C-FINAL</div>
      </div>
    </div>);
  }

  return null;
}
