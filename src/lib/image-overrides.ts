/**
 * Manual image overrides for teams, politicians, and public figures.
 * Uses local assets for Brazilian politicians and ESPN CDN for teams.
 */

import lulaImg from '@/assets/politicians/lula.jpg';
import bolsonaroImg from '@/assets/politicians/bolsonaro.jpg';
import haddadImg from '@/assets/politicians/haddad.jpg';
import tarcisioImg from '@/assets/politicians/tarcisio.jpg';
import ratinhoImg from '@/assets/politicians/ratinho.jpg';
import flavioImg from '@/assets/politicians/flavio.jpg';
import michelleImg from '@/assets/politicians/michelle.jpg';
import eduardoImg from '@/assets/politicians/eduardo.jpg';

// ── Helper: normalize a label for matching ──
function normalizeKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

// ── Politicians / Public Figures ──
const POLITICIAN_IMAGES: Record<string, string> = {
  // Brazil (local assets)
  'luiz inacio lula da silva': lulaImg,
  'lula': lulaImg,
  'jair bolsonaro': bolsonaroImg,
  'flavio bolsonaro': flavioImg,
  'eduardo bolsonaro': eduardoImg,
  'michelle bolsonaro': michelleImg,
  'fernando haddad': haddadImg,
  'tarcisio de freitas': tarcisioImg,
  'ratinho junior': ratinhoImg,
  'ciro gomes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Ciro_Gomes_em_2018_%28cropped%29.jpg/220px-Ciro_Gomes_em_2018_%28cropped%29.jpg',
  'simone tebet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Simone_Tebet_foto_oficial_2023_%28cropped%29.jpg/220px-Simone_Tebet_foto_oficial_2023_%28cropped%29.jpg',
  'renan santos': flavioImg,

  // US
  'donald trump': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/220px-Donald_Trump_official_portrait.jpg',
  'trump': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Donald_Trump_official_portrait.jpg/220px-Donald_Trump_official_portrait.jpg',
  'joe biden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/220px-Joe_Biden_presidential_portrait.jpg',
  'biden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Joe_Biden_presidential_portrait.jpg/220px-Joe_Biden_presidential_portrait.jpg',
  'kamala harris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg/220px-Kamala_Harris_Vice_Presidential_Portrait.jpg',
  'ron desantis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ron_DeSantis_Governor_%28cropped%29.jpg/220px-Ron_DeSantis_Governor_%28cropped%29.jpg',
  'elon musk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg',
  'musk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/220px-Elon_Musk_Royal_Society_%28crop2%29.jpg',
  'vivek ramaswamy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Vivek_Ramaswamy_by_Gage_Skidmore_%28cropped%29.jpg/220px-Vivek_Ramaswamy_by_Gage_Skidmore_%28cropped%29.jpg',
  'nikki haley': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Nikki_Haley_official_photo_%28cropped%29.jpg/220px-Nikki_Haley_official_photo_%28cropped%29.jpg',
  'jd vance': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Sen._J.D._Vance_-_53rd_Official_Portrait_%28cropped%29.jpg/220px-Sen._J.D._Vance_-_53rd_Official_Portrait_%28cropped%29.jpg',
  'barack obama': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/220px-President_Barack_Obama.jpg',
  'obama': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/President_Barack_Obama.jpg/220px-President_Barack_Obama.jpg',
  'bernie sanders': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Bernie_Sanders.jpg/220px-Bernie_Sanders.jpg',
  'gavin newsom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Gavin_Newsom_official_photo_%28cropped%29.jpg/220px-Gavin_Newsom_official_photo_%28cropped%29.jpg',
  'mike pence': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Mike_Pence_official_Vice_Presidential_portrait.jpg/220px-Mike_Pence_official_Vice_Presidential_portrait.jpg',

  // Tech personalities
  'sam altman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Sam_Altman_CropEdit.jpg/220px-Sam_Altman_CropEdit.jpg',
  'mark zuckerberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/220px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',
  'zuckerberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/220px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg',
  'jeff bezos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg/220px-Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg',
  'bezos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg/220px-Jeff_Bezos_at_Amazon_Spheres_Grand_Opening_in_Seattle_-_2018_%2839074799225%29_%28cropped%29.jpg',
  'tim cook': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Tim_Cook_%282017%2C_cropped%29.jpg/220px-Tim_Cook_%282017%2C_cropped%29.jpg',
  'sundar pichai': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Sundar_Pichai_%28cropped%29.jpg/220px-Sundar_Pichai_%28cropped%29.jpg',
  'satya nadella': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Satya_Nadella_%28cropped%29.jpg/220px-Satya_Nadella_%28cropped%29.jpg',
  'jensen huang': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Jensen_Huang_CEO_of_Nvidia.jpg/220px-Jensen_Huang_CEO_of_Nvidia.jpg',
  'jack dorsey': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Jack_Dorsey_2019_%28cropped%29.jpg/220px-Jack_Dorsey_2019_%28cropped%29.jpg',
  'larry fink': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Laurence_D._Fink_-_World_Economic_Forum_Annual_Meeting_2012_%28cropped%29.jpg/220px-Laurence_D._Fink_-_World_Economic_Forum_Annual_Meeting_2012_%28cropped%29.jpg',

  // World
  'xi jinping': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Xi_Jinping_2019.jpg/220px-Xi_Jinping_2019.jpg',
  'putin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Vladimir_Putin_%282020-02-20%29.jpg/220px-Vladimir_Putin_%282020-02-20%29.jpg',
  'vladimir putin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Vladimir_Putin_%282020-02-20%29.jpg/220px-Vladimir_Putin_%282020-02-20%29.jpg',
  'zelensky': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Zelensky_Official_portrait.jpg/220px-Zelensky_Official_portrait.jpg',
  'volodymyr zelensky': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Zelensky_Official_portrait.jpg/220px-Zelensky_Official_portrait.jpg',
  'narendra modi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Narendra_Modi_2021.jpg/220px-Narendra_Modi_2021.jpg',
  'modi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Narendra_Modi_2021.jpg/220px-Narendra_Modi_2021.jpg',
  'emmanuel macron': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Emmanuel_Macron_in_2019.jpg/220px-Emmanuel_Macron_in_2019.jpg',
  'macron': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Emmanuel_Macron_in_2019.jpg/220px-Emmanuel_Macron_in_2019.jpg',
  'rishi sunak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Rishi_Sunak_Official_Cabinet_Photo_%28cropped%29.jpg/220px-Rishi_Sunak_Official_Cabinet_Photo_%28cropped%29.jpg',
  'keir starmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Official_portrait_of_Keir_Starmer_%28cropped%29.jpg/220px-Official_portrait_of_Keir_Starmer_%28cropped%29.jpg',
  'olaf scholz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Olaf_Scholz_2021_cropped.jpg/220px-Olaf_Scholz_2021_cropped.jpg',
  'alberto fernandez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Presidente_Alberto_Fern%C3%A1ndez_%28cropped%29.jpg/220px-Presidente_Alberto_Fern%C3%A1ndez_%28cropped%29.jpg',
  'javier milei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Javier_Milei_Presidente.jpg/220px-Javier_Milei_Presidente.jpg',
  'milei': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Javier_Milei_Presidente.jpg/220px-Javier_Milei_Presidente.jpg',

  // ── UFC / MMA Fighters (comprehensive) ──
  // Heavyweight
  'jon jones': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-11/JONES_JON_L_BELT_11-11.png',
  'jones': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-11/JONES_JON_L_BELT_11-11.png',
  'tom aspinall': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/ASPINALL_TOM_L_07-27.png',
  'aspinall': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/ASPINALL_TOM_L_07-27.png',
  'stipe miocic': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-11/MIOCIC_STIPE_L_11-11.png',
  'ciryl gane': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/GANE_CIRYL_L_02-03.png',
  'curtis blaydes': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/BLAYDES_CURTIS_L_03-09.png',
  'sergei pavlovich': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-11/PAVLOVICH_SERGEI_L_11-11.png',
  'alexander volkov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/VOLKOV_ALEXANDER_L_06-01.png',
  'tai tuivasa': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/TUIVASA_TAI_L_02-03.png',
  'jailton almeida': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-11/ALMEIDA_JAILTON_L_11-16.png',

  // Light Heavyweight
  'alex pereira': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/PEREIRA_ALEX_L_BELT_10-05.png',
  'pereira': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/PEREIRA_ALEX_L_BELT_10-05.png',
  'magomed ankalaev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-01/ANKALAEV_MAGOMED_L_01-20.png',
  'ankalaev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-01/ANKALAEV_MAGOMED_L_01-20.png',
  'jamahal hill': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/HILL_JAMAHAL_L_04-13.png',
  'jiri prochazka': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/PROCHAZKA_JIRI_L_06-01.png',
  'prochazka': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/PROCHAZKA_JIRI_L_06-01.png',
  'khalil rountree': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/ROUNTREE_KHALIL_L_10-05.png',
  'jan blachowicz': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/BLACHOWICZ_JAN_L_03-02.png',

  // Middleweight
  'dricus du plessis': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/DU_PLESSIS_DRICUS_L_BELT_08-17.png',
  'du plessis': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/DU_PLESSIS_DRICUS_L_BELT_08-17.png',
  'israel adesanya': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/ADESANYA_ISRAEL_L_08-17.png',
  'adesanya': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/ADESANYA_ISRAEL_L_08-17.png',
  'sean strickland': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/STRICKLAND_SEAN_L_06-01.png',
  'robert whittaker': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/WHITTAKER_ROBERT_L_10-26.png',
  'whittaker': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/WHITTAKER_ROBERT_L_10-26.png',
  'khamzat chimaev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/CHIMAEV_KHAMZAT_L_10-26.png',
  'chimaev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/CHIMAEV_KHAMZAT_L_10-26.png',
  'nassourdine imavov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/IMAVOV_NASSOURDINE_L_09-28.png',

  // Welterweight
  'belal muhammad': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/MUHAMMAD_BELAL_L_BELT_07-27.png',
  'leon edwards': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/EDWARDS_LEON_L_07-27.png',
  'edwards': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-07/EDWARDS_LEON_L_07-27.png',
  'kamaru usman': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-03/USMAN_KAMARU_L_03-18.png',
  'usman': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-03/USMAN_KAMARU_L_03-18.png',
  'colby covington': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-12/COVINGTON_COLBY_L_12-16.png',
  'shavkat rakhmonov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-12/RAKHMONOV_SHAVKAT_L_12-07.png',
  'rakhmonov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-12/RAKHMONOV_SHAVKAT_L_12-07.png',
  'jack della maddalena': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/DELLA-MADDALENA_JACK_L_08-03.png',

  // Lightweight
  'islam makhachev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/MAKHACHEV_ISLAM_L_BELT_06-01.png',
  'makhachev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/MAKHACHEV_ISLAM_L_BELT_06-01.png',
  'charles oliveira': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/OLIVEIRA_CHARLES_L_04-13.png',
  'oliveira': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/OLIVEIRA_CHARLES_L_04-13.png',
  'dustin poirier': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/POIRIER_DUSTIN_L_06-01.png',
  'poirier': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/POIRIER_DUSTIN_L_06-01.png',
  'justin gaethje': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/GAETHJE_JUSTIN_L_04-13.png',
  'gaethje': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/GAETHJE_JUSTIN_L_04-13.png',
  'arman tsarukyan': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/TSARUKYAN_ARMAN_L_04-13.png',
  'tsarukyan': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/TSARUKYAN_ARMAN_L_04-13.png',
  'michael chandler': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/CHANDLER_MICHAEL_L_06-29.png',
  'chandler': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/CHANDLER_MICHAEL_L_06-29.png',
  'max holloway': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/HOLLOWAY_MAX_L_04-13.png',
  'holloway': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/HOLLOWAY_MAX_L_04-13.png',
  'conor mcgregor': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2021-02/MCGREGOR_CONOR_L.png',
  'mcgregor': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2021-02/MCGREGOR_CONOR_L.png',
  'khabib nurmagomedov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2020-10/NURMAGOMEDOV_KHABIB_L.png',
  'khabib': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2020-10/NURMAGOMEDOV_KHABIB_L.png',
  'paddy pimblett': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-12/PIMBLETT_PADDY_L_12-14.png',
  'beneil dariush': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/DARIUSH_BENEIL_L_08-03.png',

  // Featherweight
  'ilia topuria': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/TOPURIA_ILIA_L_BELT_10-26.png',
  'topuria': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-10/TOPURIA_ILIA_L_BELT_10-26.png',
  'alexander volkanovski': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/VOLKANOVSKI_ALEXANDER_L_02-17.png',
  'volkanovski': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/VOLKANOVSKI_ALEXANDER_L_02-17.png',
  'yair rodriguez': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/RODRIGUEZ_YAIR_L_02-03.png',
  'diego lopes': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-11/LOPES_DIEGO_L_11-16.png',
  'movsar evloev': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/EVLOEV_MOVSAR_L_06-01.png',
  'brian ortega': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/ORTEGA_BRIAN_L_02-24.png',
  'josh emmett': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/EMMETT_JOSH_L_06-15.png',

  // Bantamweight
  'sean omalley': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/OMALLEY_SEAN_L_09-14.png',
  "sean o'malley": 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/OMALLEY_SEAN_L_09-14.png',
  'omalley': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/OMALLEY_SEAN_L_09-14.png',
  'merab dvalishvili': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/DVALISHVILI_MERAB_L_BELT_09-14.png',
  'dvalishvili': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/DVALISHVILI_MERAB_L_BELT_09-14.png',
  'cory sandhagen': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/SANDHAGEN_CORY_L_08-03.png',
  'petr yan': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/YAN_PETR_L_03-09.png',
  'henry cejudo': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2023-05/CEJUDO_HENRY_L_05-06.png',
  'umar nurmagomedov': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/NURMAGOMEDOV_UMAR_L_08-03.png',

  // Flyweight
  'alexandre pantoja': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-12/PANTOJA_ALEXANDRE_L_BELT_12-07.png',
  'pantoja': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-12/PANTOJA_ALEXANDRE_L_BELT_12-07.png',
  'brandon royval': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/ROYVAL_BRANDON_L_02-17.png',
  'brandon moreno': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-02/MORENO_BRANDON_L_02-24.png',
  'kai kara-france': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/KARA-FRANCE_KAI_L_06-01.png',
  'amir albazi': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/ALBAZI_AMIR_L_03-02.png',

  // Women's MMA
  'amanda nunes': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2022-07/NUNES_AMANDA_L.png',
  'valentina shevchenko': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/SHEVCHENKO_VALENTINA_L_09-14.png',
  'shevchenko': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/SHEVCHENKO_VALENTINA_L_09-14.png',
  'zhang weili': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/ZHANG_WEILI_L_BELT_08-17.png',
  'weili': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-08/ZHANG_WEILI_L_BELT_08-17.png',
  'rose namajunas': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-04/NAMAJUNAS_ROSE_L_04-20.png',
  'julianna pena': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-01/PENA_JULIANNA_L_01-20.png',
  'alexa grasso': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/GRASSO_ALEXA_L_09-14.png',
  'grasso': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-09/GRASSO_ALEXA_L_09-14.png',
  'raquel pennington': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-01/PENNINGTON_RAQUEL_L_BELT_01-20.png',
  'manon fiorot': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-03/FIOROT_MANON_L_03-30.png',
  'tatiana suarez': 'https://dmxg5wxfqgb4u.cloudfront.net/styles/athlete_bio_full_body/s3/2024-06/SUAREZ_TATIANA_L_06-15.png',

  // Boxing
  'canelo alvarez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Canelo_%C3%81lvarez_2019_%28cropped%29.jpg/220px-Canelo_%C3%81lvarez_2019_%28cropped%29.jpg',
  'canelo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Canelo_%C3%81lvarez_2019_%28cropped%29.jpg/220px-Canelo_%C3%81lvarez_2019_%28cropped%29.jpg',
  'tyson fury': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Tyson_Fury_at_Place_Bell%2C_Laval_Quebec%2C_Canada_-_Dec_16_2017_%28cropped%29.jpg/220px-Tyson_Fury_at_Place_Bell%2C_Laval_Quebec%2C_Canada_-_Dec_16_2017_%28cropped%29.jpg',
  'fury': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Tyson_Fury_at_Place_Bell%2C_Laval_Quebec%2C_Canada_-_Dec_16_2017_%28cropped%29.jpg/220px-Tyson_Fury_at_Place_Bell%2C_Laval_Quebec%2C_Canada_-_Dec_16_2017_%28cropped%29.jpg',
  'oleksandr usyk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Oleksandr_Usyk_2018_%28cropped%29.jpg/220px-Oleksandr_Usyk_2018_%28cropped%29.jpg',
  'usyk': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Oleksandr_Usyk_2018_%28cropped%29.jpg/220px-Oleksandr_Usyk_2018_%28cropped%29.jpg',
  'gervonta davis': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gervonta_Davis_vs._Rolly_Romero_%28cropped%29.jpg/220px-Gervonta_Davis_vs._Rolly_Romero_%28cropped%29.jpg',
  'terence crawford': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Terence_Crawford_2019_%28cropped%29.jpg/220px-Terence_Crawford_2019_%28cropped%29.jpg',
  'jake paul': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Jake_Paul_2021.jpg/220px-Jake_Paul_2021.jpg',
  'naoya inoue': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Inoue_Naoya_2019.jpg/220px-Inoue_Naoya_2019.jpg',
  'inoue': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Inoue_Naoya_2019.jpg/220px-Inoue_Naoya_2019.jpg',
  'devin haney': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Devin_Haney_2023_%28cropped%29.jpg/220px-Devin_Haney_2023_%28cropped%29.jpg',
  'ryan garcia': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Ryan_Garcia_2020.jpg/220px-Ryan_Garcia_2020.jpg',
  'errol spence jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Errol_Spence_Jr_2019_%28cropped%29.jpg/220px-Errol_Spence_Jr_2019_%28cropped%29.jpg',
  'saul alvarez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Canelo_%C3%81lvarez_2019_%28cropped%29.jpg/220px-Canelo_%C3%81lvarez_2019_%28cropped%29.jpg',

  // Tennis
  'novak djokovic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg/220px-Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg',
  'djokovic': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg/220px-Novak_Djokovi%C4%87_Trophy_Wimbledon_2019-croped_and_edited.jpg',
  'carlos alcaraz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Carlos_Alcaraz_%282022_US_Open%29_%28cropped%29.jpg/220px-Carlos_Alcaraz_%282022_US_Open%29_%28cropped%29.jpg',
  'alcaraz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Carlos_Alcaraz_%282022_US_Open%29_%28cropped%29.jpg/220px-Carlos_Alcaraz_%282022_US_Open%29_%28cropped%29.jpg',
  'jannik sinner': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Sinner_RG24_%2817%29_%2853816527862%29_%28cropped%29.jpg/220px-Sinner_RG24_%2817%29_%2853816527862%29_%28cropped%29.jpg',
  'sinner': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Sinner_RG24_%2817%29_%2853816527862%29_%28cropped%29.jpg/220px-Sinner_RG24_%2817%29_%2853816527862%29_%28cropped%29.jpg',
  'rafael nadal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Rafael_Nadal_%2833660034908%29_%28cropped%29.jpg/220px-Rafael_Nadal_%2833660034908%29_%28cropped%29.jpg',
  'nadal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Rafael_Nadal_%2833660034908%29_%28cropped%29.jpg/220px-Rafael_Nadal_%2833660034908%29_%28cropped%29.jpg',
  'roger federer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Roger_Federer_%282019%29_%28cropped%29.jpg/220px-Roger_Federer_%282019%29_%28cropped%29.jpg',
  'federer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Roger_Federer_%282019%29_%28cropped%29.jpg/220px-Roger_Federer_%282019%29_%28cropped%29.jpg',
  'daniil medvedev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Daniil_Medvedev_%282024_Australian_Open%29_%28cropped%29.jpg/220px-Daniil_Medvedev_%282024_Australian_Open%29_%28cropped%29.jpg',
  'medvedev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Daniil_Medvedev_%282024_Australian_Open%29_%28cropped%29.jpg/220px-Daniil_Medvedev_%282024_Australian_Open%29_%28cropped%29.jpg',
  'alexander zverev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Alexander_Zverev_%282024%29.jpg/220px-Alexander_Zverev_%282024%29.jpg',
  'zverev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Alexander_Zverev_%282024%29.jpg/220px-Alexander_Zverev_%282024%29.jpg',
  'andrey rublev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Andrey_Rublev_%282022%29_%28cropped%29.jpg/220px-Andrey_Rublev_%282022%29_%28cropped%29.jpg',
  'rublev': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Andrey_Rublev_%282022%29_%28cropped%29.jpg/220px-Andrey_Rublev_%282022%29_%28cropped%29.jpg',
  'casper ruud': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ruud_RG22_%2835%29_%2852156572678%29_%28cropped%29.jpg/220px-Ruud_RG22_%2835%29_%2852156572678%29_%28cropped%29.jpg',
  'ruud': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Ruud_RG22_%2835%29_%2852156572678%29_%28cropped%29.jpg/220px-Ruud_RG22_%2835%29_%2852156572678%29_%28cropped%29.jpg',
  'stefanos tsitsipas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Stefanos_Tsitsipas_%282024%29_%28cropped%29.jpg/220px-Stefanos_Tsitsipas_%282024%29_%28cropped%29.jpg',
  'tsitsipas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Stefanos_Tsitsipas_%282024%29_%28cropped%29.jpg/220px-Stefanos_Tsitsipas_%282024%29_%28cropped%29.jpg',
  'holger rune': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Holger_Rune_%282023%29_%28cropped%29.jpg/220px-Holger_Rune_%282023%29_%28cropped%29.jpg',
  'rune': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Holger_Rune_%282023%29_%28cropped%29.jpg/220px-Holger_Rune_%282023%29_%28cropped%29.jpg',
  'taylor fritz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Taylor_Fritz_%282024%29_%28cropped%29.jpg/220px-Taylor_Fritz_%282024%29_%28cropped%29.jpg',
  'fritz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Taylor_Fritz_%282024%29_%28cropped%29.jpg/220px-Taylor_Fritz_%282024%29_%28cropped%29.jpg',
  'iga swiatek': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/2023_WTA_Finals_Swiatek_%28Quarterfinals%29_%28cropped%29.jpg/220px-2023_WTA_Finals_Swiatek_%28Quarterfinals%29_%28cropped%29.jpg',
  'swiatek': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/2023_WTA_Finals_Swiatek_%28Quarterfinals%29_%28cropped%29.jpg/220px-2023_WTA_Finals_Swiatek_%28Quarterfinals%29_%28cropped%29.jpg',
  'aryna sabalenka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Aryna_Sabalenka_%282024%29_%28cropped%29.jpg/220px-Aryna_Sabalenka_%282024%29_%28cropped%29.jpg',
  'sabalenka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Aryna_Sabalenka_%282024%29_%28cropped%29.jpg/220px-Aryna_Sabalenka_%282024%29_%28cropped%29.jpg',
  'coco gauff': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Coco_Gauff_%282023%29_%28cropped%29.jpg/220px-Coco_Gauff_%282023%29_%28cropped%29.jpg',
  'gauff': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Coco_Gauff_%282023%29_%28cropped%29.jpg/220px-Coco_Gauff_%282023%29_%28cropped%29.jpg',
  'elena rybakina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Elena_Rybakina_%282023%29_%28cropped%29.jpg/220px-Elena_Rybakina_%282023%29_%28cropped%29.jpg',
  'rybakina': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Elena_Rybakina_%282023%29_%28cropped%29.jpg/220px-Elena_Rybakina_%282023%29_%28cropped%29.jpg',
  'jessica pegula': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Jessica_Pegula_%282024%29_%28cropped%29.jpg/220px-Jessica_Pegula_%282024%29_%28cropped%29.jpg',
  'pegula': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Jessica_Pegula_%282024%29_%28cropped%29.jpg/220px-Jessica_Pegula_%282024%29_%28cropped%29.jpg',

  // Golf
  'scottie scheffler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Scottie_Scheffler_%282024%29_%28cropped%29.jpg/220px-Scottie_Scheffler_%282024%29_%28cropped%29.jpg',
  'scheffler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Scottie_Scheffler_%282024%29_%28cropped%29.jpg/220px-Scottie_Scheffler_%282024%29_%28cropped%29.jpg',
  'rory mcilroy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rory_McIlroy_%282019%29_%28cropped%29.jpg/220px-Rory_McIlroy_%282019%29_%28cropped%29.jpg',
  'mcilroy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Rory_McIlroy_%282019%29_%28cropped%29.jpg/220px-Rory_McIlroy_%282019%29_%28cropped%29.jpg',
  'tiger woods': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Tiger_Woods_in_2019.jpg/220px-Tiger_Woods_in_2019.jpg',
  'jon rahm': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Jon_Rahm_%282023%29_%28cropped%29.jpg/220px-Jon_Rahm_%282023%29_%28cropped%29.jpg',
  'brooks koepka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Brooks_Koepka_%282019%29_%28cropped%29.jpg/220px-Brooks_Koepka_%282019%29_%28cropped%29.jpg',
  'bryson dechambeau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Bryson_DeChambeau_%28cropped%29.jpg/220px-Bryson_DeChambeau_%28cropped%29.jpg',
  'dustin johnson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Dustin_Johnson_%282019%29_%28cropped%29.jpg/220px-Dustin_Johnson_%282019%29_%28cropped%29.jpg',
  'xander schauffele': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Xander_Schauffele_%282024%29.jpg/220px-Xander_Schauffele_%282024%29.jpg',
  'collin morikawa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Collin_Morikawa_%282021%29_%28cropped%29.jpg/220px-Collin_Morikawa_%282021%29_%28cropped%29.jpg',
  'jordan spieth': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Jordan_Spieth_%282015%29_%28cropped%29.jpg/220px-Jordan_Spieth_%282015%29_%28cropped%29.jpg',
  'viktor hovland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Viktor_Hovland_%282023%29_%28cropped%29.jpg/220px-Viktor_Hovland_%282023%29_%28cropped%29.jpg',
  'patrick cantlay': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Patrick_Cantlay_%282021%29_%28cropped%29.jpg/220px-Patrick_Cantlay_%282021%29_%28cropped%29.jpg',
  'wyndham clark': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wyndham_Clark_%282023%29_%28cropped%29.jpg/220px-Wyndham_Clark_%282023%29_%28cropped%29.jpg',

  // ── Formula 1 Drivers ──
  'max verstappen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg/220px-Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg',
  'verstappen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg/220px-Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg',
  'lewis hamilton': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg/220px-Lewis_Hamilton_2016_Malaysia_2.jpg',
  'hamilton': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg/220px-Lewis_Hamilton_2016_Malaysia_2.jpg',
  'charles leclerc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Charles_Leclerc_%282024%29.jpg/220px-Charles_Leclerc_%282024%29.jpg',
  'leclerc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Charles_Leclerc_%282024%29.jpg/220px-Charles_Leclerc_%282024%29.jpg',
  'lando norris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lando_Norris_%282024%29.jpg/220px-Lando_Norris_%282024%29.jpg',
  'norris': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lando_Norris_%282024%29.jpg/220px-Lando_Norris_%282024%29.jpg',
  'george russell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/George_Russell_%282024%29.jpg/220px-George_Russell_%282024%29.jpg',
  'carlos sainz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Carlos_Sainz_Jr_%282024%29.jpg/220px-Carlos_Sainz_Jr_%282024%29.jpg',
  'carlos sainz jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Carlos_Sainz_Jr_%282024%29.jpg/220px-Carlos_Sainz_Jr_%282024%29.jpg',
  'carlos sainz jr.': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Carlos_Sainz_Jr_%282024%29.jpg/220px-Carlos_Sainz_Jr_%282024%29.jpg',
  'oscar piastri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Oscar_Piastri_%282024%29.jpg/220px-Oscar_Piastri_%282024%29.jpg',
  'piastri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Oscar_Piastri_%282024%29.jpg/220px-Oscar_Piastri_%282024%29.jpg',
  'fernando alonso': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Fernando_Alonso_2016_Malaysia.jpg/220px-Fernando_Alonso_2016_Malaysia.jpg',
  'sergio perez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Sergio_P%C3%A9rez_2022.jpg/220px-Sergio_P%C3%A9rez_2022.jpg',
  'pierre gasly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Pierre_Gasly_%282023%29.jpg/220px-Pierre_Gasly_%282023%29.jpg',
  'gasly': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Pierre_Gasly_%282023%29.jpg/220px-Pierre_Gasly_%282023%29.jpg',
  'esteban ocon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Esteban_Ocon_%282023%29.jpg/220px-Esteban_Ocon_%282023%29.jpg',
  'ocon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Esteban_Ocon_%282023%29.jpg/220px-Esteban_Ocon_%282023%29.jpg',
  'valtteri bottas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Valtteri_Bottas_2019.jpg/220px-Valtteri_Bottas_2019.jpg',
  'bottas': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Valtteri_Bottas_2019.jpg/220px-Valtteri_Bottas_2019.jpg',
  'lance stroll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Lance_Stroll_%282023%29.jpg/220px-Lance_Stroll_%282023%29.jpg',
  'stroll': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Lance_Stroll_%282023%29.jpg/220px-Lance_Stroll_%282023%29.jpg',
  'alexander albon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Alexander_Albon_%282024%29.jpg/220px-Alexander_Albon_%282024%29.jpg',
  'albon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Alexander_Albon_%282024%29.jpg/220px-Alexander_Albon_%282024%29.jpg',
  'nico hulkenberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Nico_Hulkenberg_2019.jpg/220px-Nico_Hulkenberg_2019.jpg',
  'hulkenberg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Nico_Hulkenberg_2019.jpg/220px-Nico_Hulkenberg_2019.jpg',
  'kimi antonelli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Andrea_Kimi_Antonelli_%282024%29.jpg/220px-Andrea_Kimi_Antonelli_%282024%29.jpg',
  'antonelli': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Andrea_Kimi_Antonelli_%282024%29.jpg/220px-Andrea_Kimi_Antonelli_%282024%29.jpg',
  'liam lawson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Liam_Lawson_%282024%29.jpg/220px-Liam_Lawson_%282024%29.jpg',
  'oliver bearman': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Oliver_Bearman_%282024%29.jpg/220px-Oliver_Bearman_%282024%29.jpg',
  'gabriel bortoleto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Gabriel_Bortoleto_%282024%29.jpg/220px-Gabriel_Bortoleto_%282024%29.jpg',
  'bortoleto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Gabriel_Bortoleto_%282024%29.jpg/220px-Gabriel_Bortoleto_%282024%29.jpg',
  'isack hadjar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Isack_Hadjar_%282024%29.jpg/220px-Isack_Hadjar_%282024%29.jpg',
  'franco colapinto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Franco_Colapinto_%282024%29.jpg/220px-Franco_Colapinto_%282024%29.jpg',
  'colapinto': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Franco_Colapinto_%282024%29.jpg/220px-Franco_Colapinto_%282024%29.jpg',
  'arvid lindblad': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Arvid_Lindblad_%282024%29.jpg/220px-Arvid_Lindblad_%282024%29.jpg',

  // ── Soccer Players / Ballon d'Or ──
  'lionel messi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
  'messi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg/220px-Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg',
  'cristiano ronaldo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg/220px-Cristiano_Ronaldo_playing_for_Al_Nassr_FC_against_Persepolis%2C_September_2023_%28cropped%29.jpg',
  'kylian mbappe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/220px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg',
  'mbappe': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg/220px-2019-07-17_SG_Dynamo_Dresden_vs._Paris_Saint-Germain_by_Sandro_Halank%E2%80%93129_%28cropped%29.jpg',
  'erling haaland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_%282023%29.jpg/220px-Erling_Haaland_%282023%29.jpg',
  'haaland': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Erling_Haaland_%282023%29.jpg/220px-Erling_Haaland_%282023%29.jpg',
  'vinicius junior': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Vinicius_Junior_%282024%29.jpg/220px-Vinicius_Junior_%282024%29.jpg',
  'vinicius jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Vinicius_Junior_%282024%29.jpg/220px-Vinicius_Junior_%282024%29.jpg',
  'vini jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Vinicius_Junior_%282024%29.jpg/220px-Vinicius_Junior_%282024%29.jpg',
  'jude bellingham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Jude_Bellingham_%282024%29.jpg/220px-Jude_Bellingham_%282024%29.jpg',
  'bellingham': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Jude_Bellingham_%282024%29.jpg/220px-Jude_Bellingham_%282024%29.jpg',
  'rodri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Rodri_%282024%29.jpg/220px-Rodri_%282024%29.jpg',
  'lamine yamal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Lamine_Yamal_%282024%29.jpg/220px-Lamine_Yamal_%282024%29.jpg',
  'yamal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Lamine_Yamal_%282024%29.jpg/220px-Lamine_Yamal_%282024%29.jpg',
  'mohamed salah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg',
  'salah': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mohamed_Salah_2018.jpg/220px-Mohamed_Salah_2018.jpg',
  'harry kane': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Harry_Kane_%282024%29.jpg/220px-Harry_Kane_%282024%29.jpg',
  'neymar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705_%28cropped%29.jpg/220px-20180610_FIFA_Friendly_Match_Austria_vs._Brazil_Neymar_850_1705_%28cropped%29.jpg',
  'bukayo saka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Bukayo_Saka_%282024%29.jpg/220px-Bukayo_Saka_%282024%29.jpg',
  'saka': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Bukayo_Saka_%282024%29.jpg/220px-Bukayo_Saka_%282024%29.jpg',
  'florian wirtz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Florian_Wirtz_%282024%29.jpg/220px-Florian_Wirtz_%282024%29.jpg',
  'wirtz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Florian_Wirtz_%282024%29.jpg/220px-Florian_Wirtz_%282024%29.jpg',
  'raphinha': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Raphinha_%282024%29.jpg/220px-Raphinha_%282024%29.jpg',
  'pedri': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Pedri_%282024%29.jpg/220px-Pedri_%282024%29.jpg',
  'kevin de bruyne': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_%282024%29.jpg/220px-Kevin_De_Bruyne_%282024%29.jpg',
  'de bruyne': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Kevin_De_Bruyne_%282024%29.jpg/220px-Kevin_De_Bruyne_%282024%29.jpg',

  // ── US State Politicians / Governors ──
  'josh shapiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Governor_Josh_Shapiro_Official_Portrait_%28cropped%29.jpg/220px-Governor_Josh_Shapiro_Official_Portrait_%28cropped%29.jpg',
  'shapiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Governor_Josh_Shapiro_Official_Portrait_%28cropped%29.jpg/220px-Governor_Josh_Shapiro_Official_Portrait_%28cropped%29.jpg',
  'gretchen whitmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Gretchen_Whitmer_%28cropped%29.jpg/220px-Gretchen_Whitmer_%28cropped%29.jpg',
  'whitmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Gretchen_Whitmer_%28cropped%29.jpg/220px-Gretchen_Whitmer_%28cropped%29.jpg',
  'jb pritzker': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/J._B._Pritzker_Official_Photo_%28cropped%29.jpg/220px-J._B._Pritzker_Official_Photo_%28cropped%29.jpg',
  'pritzker': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/J._B._Pritzker_Official_Photo_%28cropped%29.jpg/220px-J._B._Pritzker_Official_Photo_%28cropped%29.jpg',
  'pete buttigieg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pete_Buttigieg_official_photo_%28cropped%29.jpg/220px-Pete_Buttigieg_official_photo_%28cropped%29.jpg',
  'buttigieg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Pete_Buttigieg_official_photo_%28cropped%29.jpg/220px-Pete_Buttigieg_official_photo_%28cropped%29.jpg',
  'alexandria ocasio-cortez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg/220px-Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg',
  'ocasio-cortez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg/220px-Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg',
  'aoc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg/220px-Alexandria_Ocasio-Cortez_Official_Portrait_%28cropped%29.jpg',
  'robert f kennedy jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Robert_F._Kennedy_Jr._%282023%29_%28cropped%29.jpg/220px-Robert_F._Kennedy_Jr._%282023%29_%28cropped%29.jpg',
  'rfk jr': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Robert_F._Kennedy_Jr._%282023%29_%28cropped%29.jpg/220px-Robert_F._Kennedy_Jr._%282023%29_%28cropped%29.jpg',
  'marco rubio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Official_Photo_of_Senator_Marco_Rubio_%28cropped%29.jpg/220px-Official_Photo_of_Senator_Marco_Rubio_%28cropped%29.jpg',
  'rubio': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Official_Photo_of_Senator_Marco_Rubio_%28cropped%29.jpg/220px-Official_Photo_of_Senator_Marco_Rubio_%28cropped%29.jpg',
  'ted cruz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Ted_Cruz_official_116th_portrait_%28cropped%29.jpg/220px-Ted_Cruz_official_116th_portrait_%28cropped%29.jpg',
  'tim scott': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Tim_Scott%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg/220px-Tim_Scott%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg',
  'tulsi gabbard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Tulsi_Gabbard%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg/220px-Tulsi_Gabbard%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg',
  'gabbard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Tulsi_Gabbard%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg/220px-Tulsi_Gabbard%2C_official_portrait%2C_113th_Congress_%28cropped%29.jpg',
  'greg abbott': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Greg_Abbott_official_portrait_%28cropped%29.jpg/220px-Greg_Abbott_official_portrait_%28cropped%29.jpg',
  'doug burgum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Doug_Burgum_%28cropped%29.jpg/220px-Doug_Burgum_%28cropped%29.jpg',
  'kristi noem': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Kristi_Noem_by_Gage_Skidmore_%28cropped%29.jpg/220px-Kristi_Noem_by_Gage_Skidmore_%28cropped%29.jpg',

  // ── NBA Players ──
  'shai gilgeous-alexander': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278073.png&w=350&h=254',
  'shai gilgeous alexander': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278073.png&w=350&h=254',
  'gilgeous-alexander': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4278073.png&w=350&h=254',
  'nikola jokic': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3112335.png&w=350&h=254',
  'jokic': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3112335.png&w=350&h=254',
  'victor wembanyama': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4871658.png&w=350&h=254',
  'wembanyama': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4871658.png&w=350&h=254',
  'luka doncic': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3945274.png&w=350&h=254',
  'doncic': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3945274.png&w=350&h=254',
  'giannis antetokounmpo': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032977.png&w=350&h=254',
  'antetokounmpo': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032977.png&w=350&h=254',
  'lebron james': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254',
  'lebron': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png&w=350&h=254',
  'stephen curry': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png&w=350&h=254',
  'steph curry': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png&w=350&h=254',
  'curry': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3975.png&w=350&h=254',
  'jayson tatum': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4065648.png&w=350&h=254',
  'tatum': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4065648.png&w=350&h=254',
  'kevin durant': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3202.png&w=350&h=254',
  'durant': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3202.png&w=350&h=254',
  'anthony edwards': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594327.png&w=350&h=254',
  'ant edwards': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594327.png&w=350&h=254',
  'ja morant': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4279888.png&w=350&h=254',
  'morant': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4279888.png&w=350&h=254',
  'devin booker': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136193.png&w=350&h=254',
  'booker': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136193.png&w=350&h=254',
  'jimmy butler': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6430.png&w=350&h=254',
  'jalen brunson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3934672.png&w=350&h=254',
  'brunson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3934672.png&w=350&h=254',
  'donovan mitchell': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3908845.png&w=350&h=254',
  'damian lillard': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6606.png&w=350&h=254',
  'lillard': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6606.png&w=350&h=254',
  'joel embiid': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3059318.png&w=350&h=254',
  'embiid': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3059318.png&w=350&h=254',
  'kawhi leonard': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6450.png&w=350&h=254',
  'leonard': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6450.png&w=350&h=254',
  'paul george': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4251.png&w=350&h=254',
  'james harden': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3992.png&w=350&h=254',
  'harden': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3992.png&w=350&h=254',
  'tyrese haliburton': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432166.png&w=350&h=254',
  'haliburton': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432166.png&w=350&h=254',
  'trae young': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4277905.png&w=350&h=254',
  'cade cunningham': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432166.png&w=350&h=254',
  'cunningham': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432166.png&w=350&h=254',
  'paolo banchero': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4706212.png&w=350&h=254',
  'banchero': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4706212.png&w=350&h=254',
  'zion williamson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395628.png&w=350&h=254',
  'zion': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395628.png&w=350&h=254',
  'cooper flagg': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/5105612.png&w=350&h=254',
  'flagg': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/5105612.png&w=350&h=254',
  'karl-anthony towns': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3136195.png&w=350&h=254',
  'bam adebayo': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066261.png&w=350&h=254',
  'adebayo': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066261.png&w=350&h=254',
  'domantas sabonis': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3155942.png&w=350&h=254',
  'de\'aaron fox': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066259.png&w=350&h=254',
  'dearon fox': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066259.png&w=350&h=254',
  'kyrie irving': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6442.png&w=350&h=254',
  'kyrie': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/6442.png&w=350&h=254',
  'russell westbrook': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3468.png&w=350&h=254',
  'westbrook': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3468.png&w=350&h=254',
  'chris paul': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/2779.png&w=350&h=254',
  'lauri markkanen': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066336.png&w=350&h=254',
  'alperen sengun': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4683633.png&w=350&h=254',
  'franz wagner': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432809.png&w=350&h=254',

  // ── NFL Quarterbacks / Stars ──
  'patrick mahomes': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3139477.png&w=350&h=254',
  'mahomes': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3139477.png&w=350&h=254',
  'josh allen': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3918298.png&w=350&h=254',
  'lamar jackson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3916387.png&w=350&h=254',
  'joe burrow': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3915511.png&w=350&h=254',
  'burrow': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3915511.png&w=350&h=254',
  'jalen hurts': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4040715.png&w=350&h=254',
  'hurts': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4040715.png&w=350&h=254',
  'tua tagovailoa': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241479.png&w=350&h=254',
  'dak prescott': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2577417.png&w=350&h=254',
  'prescott': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2577417.png&w=350&h=254',
  'cj stroud': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4432577.png&w=350&h=254',
  'stroud': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4432577.png&w=350&h=254',
  'caleb williams': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4429013.png&w=350&h=254',
  'jayden daniels': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4426388.png&w=350&h=254',
  'travis kelce': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15847.png&w=350&h=254',
  'kelce': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/15847.png&w=350&h=254',
  'tyreek hill': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3116406.png&w=350&h=254',
  'aaron rodgers': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/8439.png&w=350&h=254',
  'rodgers': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/8439.png&w=350&h=254',
  'tom brady': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2330.png&w=350&h=254',
  'brady': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/2330.png&w=350&h=254',

  // ── Additional Soccer/F1 aliases ──
  'ronaldo': 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/28054.png&w=350&h=254',
  'neymar jr': 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/131672.png&w=350&h=254',
  'robert lewandowski': 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/67847.png&w=350&h=254',
  'lewandowski': 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/67847.png&w=350&h=254',
  'kane': 'https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/168091.png&w=350&h=254',
  'sainz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Carlos_Sainz_Jr_%282024%29.jpg/220px-Carlos_Sainz_Jr_%282024%29.jpg',
  'perez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Sergio_P%C3%A9rez_2022.jpg/220px-Sergio_P%C3%A9rez_2022.jpg',
  'daniel ricciardo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Daniel_Ricciardo_%282024%29_%28cropped%29.jpg/220px-Daniel_Ricciardo_%282024%29_%28cropped%29.jpg',
  'ricciardo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Daniel_Ricciardo_%282024%29_%28cropped%29.jpg/220px-Daniel_Ricciardo_%282024%29_%28cropped%29.jpg',
  'yuki tsunoda': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Yuki_Tsunoda_%282024%29_%28cropped%29.jpg/220px-Yuki_Tsunoda_%282024%29_%28cropped%29.jpg',
  'kevin magnussen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Kevin_Magnussen_%282024%29_%28cropped%29.jpg/220px-Kevin_Magnussen_%282024%29_%28cropped%29.jpg',
  'zhou guanyu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Zhou_Guanyu_%282024%29_%28cropped%29.jpg/220px-Zhou_Guanyu_%282024%29_%28cropped%29.jpg',
  'logan sargeant': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Logan_Sargeant_%282024%29_%28cropped%29.jpg/220px-Logan_Sargeant_%282024%29_%28cropped%29.jpg',

  // ── NHL Players ──
  'connor mcdavid': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3895074.png&w=350&h=254',
  'mcdavid': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3895074.png&w=350&h=254',
  'nathan mackinnon': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041969.png&w=350&h=254',
  'mackinnon': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041969.png&w=350&h=254',
  'auston matthews': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024123.png&w=350&h=254',
  'matthews': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024123.png&w=350&h=254',
  'leon draisaitl': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114727.png&w=350&h=254',
  'draisaitl': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114727.png&w=350&h=254',
  'alex ovechkin': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3101.png&w=350&h=254',
  'ovechkin': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3101.png&w=350&h=254',
  'sidney crosby': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114.png&w=350&h=254',
  'crosby': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114.png&w=350&h=254',
  'nikita kucherov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3042109.png&w=350&h=254',
  'kucherov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3042109.png&w=350&h=254',
  'cale makar': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4352703.png&w=350&h=254',
  'makar': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4352703.png&w=350&h=254',
  'david pastrnak': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3900199.png&w=350&h=254',
  'pastrnak': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3900199.png&w=350&h=254',

  // ── MLB Players ──
  'shohei ohtani': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39832.png&w=350&h=254',
  'ohtani': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39832.png&w=350&h=254',
  'mike trout': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30836.png&w=350&h=254',
  'trout': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30836.png&w=350&h=254',
  'aaron judge': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33192.png&w=350&h=254',
  'judge': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33192.png&w=350&h=254',
  'mookie betts': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33039.png&w=350&h=254',
  'betts': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33039.png&w=350&h=254',
  'freddie freeman': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30193.png&w=350&h=254',
  'ronald acuna jr': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36185.png&w=350&h=254',
  'acuna': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36185.png&w=350&h=254',
  'juan soto': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/38563.png&w=350&h=254',
  'soto': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/38563.png&w=350&h=254',

  // ── Entertainment / Celebrities ──
  'taylor swift': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/220px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  'swift': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/220px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  'drake': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Drake_July_2016_%28cropped%29.jpg/220px-Drake_July_2016_%28cropped%29.jpg',
  'kanye west': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Kanye_West_at_the_2009_Tribeca_Film_Festival_%28cropped%29.jpg/220px-Kanye_West_at_the_2009_Tribeca_Film_Festival_%28cropped%29.jpg',
  'ye': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Kanye_West_at_the_2009_Tribeca_Film_Festival_%28cropped%29.jpg/220px-Kanye_West_at_the_2009_Tribeca_Film_Festival_%28cropped%29.jpg',
  'rihanna': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/220px-Rihanna_Fenty_2018.png',
  'beyonce': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png/220px-Beyonc%C3%A9_at_The_Lion_King_European_Premiere_2019.png',
  'travis scott': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Travis_Scott_-_Openair_Frauenfeld_2019_08.jpg/220px-Travis_Scott_-_Openair_Frauenfeld_2019_08.jpg',
  'bad bunny': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Bad_Bunny_-_2023.jpg/220px-Bad_Bunny_-_2023.jpg',
  'kendrick lamar': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Kendrick_Lamar_2016.jpg/220px-Kendrick_Lamar_2016.jpg',
  'post malone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Post_Malone_Stavernfestivalen_2018_%28cropped%29.jpg/220px-Post_Malone_Stavernfestivalen_2018_%28cropped%29.jpg',
  'the weeknd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_with_hand_in_the_air_performing_live_in_Hong_Kong_in_November_2018_%28cropped%29.jpg/220px-The_Weeknd_with_hand_in_the_air_performing_live_in_Hong_Kong_in_November_2018_%28cropped%29.jpg',
  'billie eilish': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Billie_Eilish_2019_by_Glenn_Francis_%28cropped%29_2.jpg/220px-Billie_Eilish_2019_by_Glenn_Francis_%28cropped%29_2.jpg',
  'dua lipa': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Dua_Lipa_%28cropped%29.png/220px-Dua_Lipa_%28cropped%29.png',
  'ariana grande': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Ariana_Grande_Grammys_Red_Carpet_2020.png/220px-Ariana_Grande_Grammys_Red_Carpet_2020.png',
  'ed sheeran': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Ed_Sheeran-6886_%28cropped%29.jpg/220px-Ed_Sheeran-6886_%28cropped%29.jpg',
  'adele': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Adele_for_Vogue_in_2021.png/220px-Adele_for_Vogue_in_2021.png',
  'harry styles': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Harry_Styles_Grammys_2023_3_%28cropped%29.png/220px-Harry_Styles_Grammys_2023_3_%28cropped%29.png',
  'olivia rodrigo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Olivia_Rodrigo_at_the_White_House_in_2021_%28cropped%29.jpg/220px-Olivia_Rodrigo_at_the_White_House_in_2021_%28cropped%29.jpg',
  'sabrina carpenter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Sabrina_Carpenter_%282023%29.jpg/220px-Sabrina_Carpenter_%282023%29.jpg',
  'chappell roan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Chappell_Roan_2024.jpg/220px-Chappell_Roan_2024.jpg',

  // ── Crypto / Finance Personalities ──
  'vitalik buterin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/220px-VitalikButerinProfile.jpg',
  'vitalik': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/VitalikButerinProfile.jpg/220px-VitalikButerinProfile.jpg',
  'changpeng zhao': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Changpeng_Zhao.jpg/220px-Changpeng_Zhao.jpg',
  'cz': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Changpeng_Zhao.jpg/220px-Changpeng_Zhao.jpg',
  'michael saylor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Michael_Saylor.jpg/220px-Michael_Saylor.jpg',
  'saylor': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Michael_Saylor.jpg/220px-Michael_Saylor.jpg',
  'brian armstrong': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Brian_Armstrong.jpg/220px-Brian_Armstrong.jpg',
  'gary gensler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Gary_Gensler_SEC.jpg/220px-Gary_Gensler_SEC.jpg',
  'gensler': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Gary_Gensler_SEC.jpg/220px-Gary_Gensler_SEC.jpg',
  'cathie wood': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Cathie_Wood_%28cropped%29.jpg/220px-Cathie_Wood_%28cropped%29.jpg',
  'warren buffett': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/220px-Warren_Buffett_KU_Visit.jpg',
  'buffett': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/220px-Warren_Buffett_KU_Visit.jpg',
  'jamie dimon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Jamie_Dimon_%28cropped%29.jpg/220px-Jamie_Dimon_%28cropped%29.jpg',
  'jerome powell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Jerome_H._Powell.jpg/220px-Jerome_H._Powell.jpg',
  'powell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Jerome_H._Powell.jpg/220px-Jerome_H._Powell.jpg',
  'janet yellen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Janet_Yellen_official_Federal_Reserve_portrait.jpg/220px-Janet_Yellen_official_Federal_Reserve_portrait.jpg',
  'yellen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Janet_Yellen_official_Federal_Reserve_portrait.jpg/220px-Janet_Yellen_official_Federal_Reserve_portrait.jpg',

  // ── Additional World Leaders ──
  'recep tayyip erdogan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg/220px-Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg',
  'erdogan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg/220px-Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg',
  'benjamin netanyahu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Benjamin_Netanyahu_2024.jpg/220px-Benjamin_Netanyahu_2024.jpg',
  'netanyahu': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Benjamin_Netanyahu_2024.jpg/220px-Benjamin_Netanyahu_2024.jpg',
  'justin trudeau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Justin_Trudeau_in_Lima%2C_Peru_-_2024_%28cropped%29.jpg/220px-Justin_Trudeau_in_Lima%2C_Peru_-_2024_%28cropped%29.jpg',
  'trudeau': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Justin_Trudeau_in_Lima%2C_Peru_-_2024_%28cropped%29.jpg/220px-Justin_Trudeau_in_Lima%2C_Peru_-_2024_%28cropped%29.jpg',
  'pedro sanchez': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Pedro_S%C3%A1nchez_in_2024.jpg/220px-Pedro_S%C3%A1nchez_in_2024.jpg',
  'giorgia meloni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Giorgia_Meloni_Official_2022_%28cropped%29.jpg/220px-Giorgia_Meloni_Official_2022_%28cropped%29.jpg',
  'meloni': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Giorgia_Meloni_Official_2022_%28cropped%29.jpg/220px-Giorgia_Meloni_Official_2022_%28cropped%29.jpg',
  'gustavo petro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Gustavo_Petro_Urrego_%28cropped%29.jpg/220px-Gustavo_Petro_Urrego_%28cropped%29.jpg',
  'petro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Gustavo_Petro_Urrego_%28cropped%29.jpg/220px-Gustavo_Petro_Urrego_%28cropped%29.jpg',
  'claudia sheinbaum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Claudia_Sheinbaum_2024.jpg/220px-Claudia_Sheinbaum_2024.jpg',
  'sheinbaum': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Claudia_Sheinbaum_2024.jpg/220px-Claudia_Sheinbaum_2024.jpg',
  'nicolas maduro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Nicol%C3%A1s_Maduro_2024.jpg/220px-Nicol%C3%A1s_Maduro_2024.jpg',
  'maduro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Nicol%C3%A1s_Maduro_2024.jpg/220px-Nicol%C3%A1s_Maduro_2024.jpg',
  'kim jong un': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Kim_Jong-un_in_2024_%28cropped%29.jpg/220px-Kim_Jong-un_in_2024_%28cropped%29.jpg',
  'gabriel boric': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Gabriel_Boric_%282022%29_%28cropped%29.jpg/220px-Gabriel_Boric_%282022%29_%28cropped%29.jpg',
  'boric': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Gabriel_Boric_%282022%29_%28cropped%29.jpg/220px-Gabriel_Boric_%282022%29_%28cropped%29.jpg',

  // ── Additional Brazilian Politicians ──
  'guilherme boulos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Guilherme_Boulos_em_2024_%28cropped%29.jpg/220px-Guilherme_Boulos_em_2024_%28cropped%29.jpg',
  'boulos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Guilherme_Boulos_em_2024_%28cropped%29.jpg/220px-Guilherme_Boulos_em_2024_%28cropped%29.jpg',
  'ronaldo caiado': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ronaldo_Caiado_em_2023.jpg/220px-Ronaldo_Caiado_em_2023.jpg',
  'caiado': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Ronaldo_Caiado_em_2023.jpg/220px-Ronaldo_Caiado_em_2023.jpg',
  'romeu zema': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Romeu_Zema_em_2023_%28cropped%29.jpg/220px-Romeu_Zema_em_2023_%28cropped%29.jpg',
  'zema': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Romeu_Zema_em_2023_%28cropped%29.jpg/220px-Romeu_Zema_em_2023_%28cropped%29.jpg',
  'helder barbalho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Helder_Barbalho_2023_%28cropped%29.jpg/220px-Helder_Barbalho_2023_%28cropped%29.jpg',
  'barbalho': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Helder_Barbalho_2023_%28cropped%29.jpg/220px-Helder_Barbalho_2023_%28cropped%29.jpg',
  'arthur lira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Arthur_Lira_foto_oficial_%28cropped%29.jpg/220px-Arthur_Lira_foto_oficial_%28cropped%29.jpg',
  'lira': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Arthur_Lira_foto_oficial_%28cropped%29.jpg/220px-Arthur_Lira_foto_oficial_%28cropped%29.jpg',
  'rodrigo pacheco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Rodrigo_Pacheco_foto_oficial_2023_%28cropped%29.jpg/220px-Rodrigo_Pacheco_foto_oficial_2023_%28cropped%29.jpg',
  'pacheco': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Rodrigo_Pacheco_foto_oficial_2023_%28cropped%29.jpg/220px-Rodrigo_Pacheco_foto_oficial_2023_%28cropped%29.jpg',
  'joao doria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Jo%C3%A3o_Doria_em_2022_%28cropped%29.jpg/220px-Jo%C3%A3o_Doria_em_2022_%28cropped%29.jpg',
  'doria': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Jo%C3%A3o_Doria_em_2022_%28cropped%29.jpg/220px-Jo%C3%A3o_Doria_em_2022_%28cropped%29.jpg',
  'marina silva': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Marina_Silva_foto_oficial_2023_%28cropped%29.jpg/220px-Marina_Silva_foto_oficial_2023_%28cropped%29.jpg',
  'pablo marcal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pablo_Mar%C3%A7al_em_2024.jpg/220px-Pablo_Mar%C3%A7al_em_2024.jpg',
  'marcal': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Pablo_Mar%C3%A7al_em_2024.jpg/220px-Pablo_Mar%C3%A7al_em_2024.jpg',
  'tabata amaral': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Tab_Amaral.jpg/220px-Tab_Amaral.jpg',
  'ricardo nunes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ricardo_Nunes_%28cropped%29.jpg/220px-Ricardo_Nunes_%28cropped%29.jpg',
  'nunes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Ricardo_Nunes_%28cropped%29.jpg/220px-Ricardo_Nunes_%28cropped%29.jpg',

  // ── Additional Soccer Players ──
  'dani olmo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Dani_Olmo_%282024%29.jpg/220px-Dani_Olmo_%282024%29.jpg',
  'olmo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Dani_Olmo_%282024%29.jpg/220px-Dani_Olmo_%282024%29.jpg',
  'cole palmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Cole_Palmer_%282024%29.jpg/220px-Cole_Palmer_%282024%29.jpg',
  'palmer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Cole_Palmer_%282024%29.jpg/220px-Cole_Palmer_%282024%29.jpg',
  'phil foden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Phil_Foden_%282024%29.jpg/220px-Phil_Foden_%282024%29.jpg',
  'foden': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Phil_Foden_%282024%29.jpg/220px-Phil_Foden_%282024%29.jpg',
  'declan rice': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Declan_Rice_%282024%29.jpg/220px-Declan_Rice_%282024%29.jpg',
  'martin odegaard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Martin_%C3%98degaard_%282024%29.jpg/220px-Martin_%C3%98degaard_%282024%29.jpg',
  'odegaard': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Martin_%C3%98degaard_%282024%29.jpg/220px-Martin_%C3%98degaard_%282024%29.jpg',
  'toni kroos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Toni_Kroos_2024.jpg/220px-Toni_Kroos_2024.jpg',
  'kroos': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Toni_Kroos_2024.jpg/220px-Toni_Kroos_2024.jpg',
  'jamal musiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Jamal_Musiala_%282024%29.jpg/220px-Jamal_Musiala_%282024%29.jpg',
  'musiala': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Jamal_Musiala_%282024%29.jpg/220px-Jamal_Musiala_%282024%29.jpg',
  'alexander isak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Alexander_Isak_%282024%29.jpg/220px-Alexander_Isak_%282024%29.jpg',
  'isak': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Alexander_Isak_%282024%29.jpg/220px-Alexander_Isak_%282024%29.jpg',
  'bruno fernandes': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Bruno_Fernandes_%282024%29.jpg/220px-Bruno_Fernandes_%282024%29.jpg',

  // ── Additional NBA Players ──
  'dyson daniels': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4697014.png&w=350&h=254',
  'evan mobley': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432573.png&w=350&h=254',
  'mobley': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4432573.png&w=350&h=254',
  'scottie barnes': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594268.png&w=350&h=254',
  'barnes': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4594268.png&w=350&h=254',
  'darius garland': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395725.png&w=350&h=254',
  'garland': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395725.png&w=350&h=254',
  'derrick white': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3078576.png&w=350&h=254',
  'pascal siakam': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3149673.png&w=350&h=254',
  'siakam': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3149673.png&w=350&h=254',
  'brandon ingram': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066328.png&w=350&h=254',
  'ingram': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4066328.png&w=350&h=254',
  'mikal bridges': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3934719.png&w=350&h=254',
  'dejounte murray': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3907497.png&w=350&h=254',
  'rudy gobert': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032976.png&w=350&h=254',
  'gobert': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/3032976.png&w=350&h=254',
  'deandre ayton': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395726.png&w=350&h=254',
  'ayton': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4395726.png&w=350&h=254',
  'jalen williams': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4433218.png&w=350&h=254',
  'chet holmgren': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4871634.png&w=350&h=254',
  'holmgren': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/4871634.png&w=350&h=254',

  // ── Additional NFL Stars ──
  'saquon barkley': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3929630.png&w=350&h=254',
  'barkley': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3929630.png&w=350&h=254',
  'derrick henry': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3043078.png&w=350&h=254',
  'jahmyr gibbs': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4429795.png&w=350&h=254',
  'micah parsons': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4567048.png&w=350&h=254',
  'parsons': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4567048.png&w=350&h=254',
  'nick bosa': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3916148.png&w=350&h=254',
  'bosa': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/3916148.png&w=350&h=254',
  'ja\'marr chase': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4362628.png&w=350&h=254',
  'chase': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4362628.png&w=350&h=254',
  'ceedee lamb': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241389.png&w=350&h=254',
  'lamb': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241389.png&w=350&h=254',
  'justin jefferson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4262921.png&w=350&h=254',
  'jefferson': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4262921.png&w=350&h=254',
  'davante adams': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/16800.png&w=350&h=254',
  'tua': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4241479.png&w=350&h=254',
  'jordan love': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4036378.png&w=350&h=254',
  'brock purdy': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4432758.png&w=350&h=254',
  'purdy': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4432758.png&w=350&h=254',
  'drake maye': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/4429084.png&w=350&h=254',

  // ── Additional NHL Stars ──
  'jack eichel': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3900197.png&w=350&h=254',
  'eichel': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3900197.png&w=350&h=254',
  'kirill kaprizov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233583.png&w=350&h=254',
  'kaprizov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233583.png&w=350&h=254',
  'igor shesterkin': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233635.png&w=350&h=254',
  'shesterkin': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4233635.png&w=350&h=254',
  'matthew tkachuk': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024126.png&w=350&h=254',
  'tkachuk': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/4024126.png&w=350&h=254',
  'aleksander barkov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041971.png&w=350&h=254',
  'barkov': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3041971.png&w=350&h=254',
  'sam reinhart': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114725.png&w=350&h=254',
  'reinhart': 'https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/3114725.png&w=350&h=254',

  // ── Additional MLB Stars ──
  'elly de la cruz': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42403.png&w=350&h=254',
  'de la cruz': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/42403.png&w=350&h=254',
  'francisco lindor': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33535.png&w=350&h=254',
  'lindor': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33535.png&w=350&h=254',
  'corey seager': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32691.png&w=350&h=254',
  'seager': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32691.png&w=350&h=254',
  'trea turner': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/32150.png&w=350&h=254',
  'bryce harper': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30951.png&w=350&h=254',
  'harper': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/30951.png&w=350&h=254',
  'fernando tatis jr': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39620.png&w=350&h=254',
  'tatis': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/39620.png&w=350&h=254',
  'yordan alvarez': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/36963.png&w=350&h=254',
  'corbin burnes': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/35988.png&w=350&h=254',
  'gerrit cole': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33205.png&w=350&h=254',
  'cole': 'https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/33205.png&w=350&h=254',

  // ── Racing / NASCAR ──
  'lewis hamilton f1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Lewis_Hamilton_2016_Malaysia_2.jpg/220px-Lewis_Hamilton_2016_Malaysia_2.jpg',
  'max verstappen f1': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg/220px-Max_Verstappen_2017_Malaysia_3_%28cropped%29.jpg',

  // ── Podcasters / Media Personalities ──
  'joe rogan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Joe_Rogan_2019_by_Gage_Skidmore.jpg/220px-Joe_Rogan_2019_by_Gage_Skidmore.jpg',
  'rogan': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Joe_Rogan_2019_by_Gage_Skidmore.jpg/220px-Joe_Rogan_2019_by_Gage_Skidmore.jpg',
  'tucker carlson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Tucker_Carlson_%2850742472891%29_%28cropped%29.jpg/220px-Tucker_Carlson_%2850742472891%29_%28cropped%29.jpg',
  'carlson': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Tucker_Carlson_%2850742472891%29_%28cropped%29.jpg/220px-Tucker_Carlson_%2850742472891%29_%28cropped%29.jpg',
  'ben shapiro': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Ben_Shapiro_%282019%29_%28cropped%29.jpg/220px-Ben_Shapiro_%282019%29_%28cropped%29.jpg',
  'mr beast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/MrBeast_2023_%28cropped%29.jpg/220px-MrBeast_2023_%28cropped%29.jpg',
  'mrbeast': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/MrBeast_2023_%28cropped%29.jpg/220px-MrBeast_2023_%28cropped%29.jpg',
};

// ── Sports Team Logos (using ESPN CDN for stability) ──
// Format: https://a.espncdn.com/i/teamlogos/{league}/500/{team_abbr}.png
const TEAM_LOGOS: Record<string, string> = {
  // NBA
  'los angeles lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
  'lakers': 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png',
  'boston celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
  'celtics': 'https://a.espncdn.com/i/teamlogos/nba/500/bos.png',
  'golden state warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',
  'warriors': 'https://a.espncdn.com/i/teamlogos/nba/500/gs.png',
  'miami heat': 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png',
  'heat': 'https://a.espncdn.com/i/teamlogos/nba/500/mia.png',
  'milwaukee bucks': 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
  'bucks': 'https://a.espncdn.com/i/teamlogos/nba/500/mil.png',
  'phoenix suns': 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
  'suns': 'https://a.espncdn.com/i/teamlogos/nba/500/phx.png',
  'denver nuggets': 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
  'nuggets': 'https://a.espncdn.com/i/teamlogos/nba/500/den.png',
  'philadelphia 76ers': 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
  '76ers': 'https://a.espncdn.com/i/teamlogos/nba/500/phi.png',
  'new york knicks': 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png',
  'knicks': 'https://a.espncdn.com/i/teamlogos/nba/500/ny.png',
  'brooklyn nets': 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
  'nets': 'https://a.espncdn.com/i/teamlogos/nba/500/bkn.png',
  'chicago bulls': 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
  'bulls': 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
  'toronto raptors': 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png',
  'raptors': 'https://a.espncdn.com/i/teamlogos/nba/500/tor.png',
  'cleveland cavaliers': 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
  'cavaliers': 'https://a.espncdn.com/i/teamlogos/nba/500/cle.png',
  'dallas mavericks': 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png',
  'mavericks': 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png',
  'orlando magic': 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png',
  'magic': 'https://a.espncdn.com/i/teamlogos/nba/500/orl.png',
  'sacramento kings': 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
  'kings': 'https://a.espncdn.com/i/teamlogos/nba/500/sac.png',
  'houston rockets': 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png',
  'rockets': 'https://a.espncdn.com/i/teamlogos/nba/500/hou.png',
  'minnesota timberwolves': 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
  'timberwolves': 'https://a.espncdn.com/i/teamlogos/nba/500/min.png',
  'oklahoma city thunder': 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
  'thunder': 'https://a.espncdn.com/i/teamlogos/nba/500/okc.png',
  'atlanta hawks': 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
  'hawks': 'https://a.espncdn.com/i/teamlogos/nba/500/atl.png',
  'indiana pacers': 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
  'pacers': 'https://a.espncdn.com/i/teamlogos/nba/500/ind.png',
  'memphis grizzlies': 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
  'grizzlies': 'https://a.espncdn.com/i/teamlogos/nba/500/mem.png',
  'portland trail blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
  'trail blazers': 'https://a.espncdn.com/i/teamlogos/nba/500/por.png',
  'san antonio spurs': 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png',
  'spurs': 'https://a.espncdn.com/i/teamlogos/nba/500/sa.png',
  'new orleans pelicans': 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
  'pelicans': 'https://a.espncdn.com/i/teamlogos/nba/500/no.png',
  'detroit pistons': 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
  'pistons': 'https://a.espncdn.com/i/teamlogos/nba/500/det.png',
  'charlotte hornets': 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
  'hornets': 'https://a.espncdn.com/i/teamlogos/nba/500/cha.png',
  'utah jazz': 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png',
  'jazz': 'https://a.espncdn.com/i/teamlogos/nba/500/utah.png',
  'washington wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
  'wizards': 'https://a.espncdn.com/i/teamlogos/nba/500/wsh.png',
  'la clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',
  'clippers': 'https://a.espncdn.com/i/teamlogos/nba/500/lac.png',

  // NHL
  'edmonton oilers': 'https://a.espncdn.com/i/teamlogos/nhl/500/edm.png',
  'oilers': 'https://a.espncdn.com/i/teamlogos/nhl/500/edm.png',
  'florida panthers': 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png',
  'panthers': 'https://a.espncdn.com/i/teamlogos/nhl/500/fla.png',
  'colorado avalanche': 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png',
  'avalanche': 'https://a.espncdn.com/i/teamlogos/nhl/500/col.png',
  'dallas stars': 'https://a.espncdn.com/i/teamlogos/nhl/500/dal.png',
  'stars': 'https://a.espncdn.com/i/teamlogos/nhl/500/dal.png',
  'new york rangers': 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png',
  'rangers': 'https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png',
  'carolina hurricanes': 'https://a.espncdn.com/i/teamlogos/nhl/500/car.png',
  'hurricanes': 'https://a.espncdn.com/i/teamlogos/nhl/500/car.png',
  'winnipeg jets': 'https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png',
  'jets': 'https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png',
  'toronto maple leafs': 'https://a.espncdn.com/i/teamlogos/nhl/500/tor.png',
  'maple leafs': 'https://a.espncdn.com/i/teamlogos/nhl/500/tor.png',
  'vancouver canucks': 'https://a.espncdn.com/i/teamlogos/nhl/500/van.png',
  'canucks': 'https://a.espncdn.com/i/teamlogos/nhl/500/van.png',
  'vegas golden knights': 'https://a.espncdn.com/i/teamlogos/nhl/500/vgs.png',
  'golden knights': 'https://a.espncdn.com/i/teamlogos/nhl/500/vgs.png',
  'boston bruins': 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png',
  'bruins': 'https://a.espncdn.com/i/teamlogos/nhl/500/bos.png',
  'tampa bay lightning': 'https://a.espncdn.com/i/teamlogos/nhl/500/tb.png',
  'lightning': 'https://a.espncdn.com/i/teamlogos/nhl/500/tb.png',
  'new jersey devils': 'https://a.espncdn.com/i/teamlogos/nhl/500/nj.png',
  'devils': 'https://a.espncdn.com/i/teamlogos/nhl/500/nj.png',
  'nashville predators': 'https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png',
  'predators': 'https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png',
  'pittsburgh penguins': 'https://a.espncdn.com/i/teamlogos/nhl/500/pit.png',
  'penguins': 'https://a.espncdn.com/i/teamlogos/nhl/500/pit.png',
  'minnesota wild': 'https://a.espncdn.com/i/teamlogos/nhl/500/min.png',
  'wild': 'https://a.espncdn.com/i/teamlogos/nhl/500/min.png',
  'washington capitals': 'https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png',
  'capitals': 'https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png',
  'montreal canadiens': 'https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png',
  'canadiens': 'https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png',
  'ottawa senators': 'https://a.espncdn.com/i/teamlogos/nhl/500/ott.png',
  'senators': 'https://a.espncdn.com/i/teamlogos/nhl/500/ott.png',

  // NFL
  'kansas city chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  'chiefs': 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png',
  'san francisco 49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
  '49ers': 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png',
  'baltimore ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
  'ravens': 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png',
  'buffalo bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  'bills': 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png',
  'detroit lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
  'lions': 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png',
  'philadelphia eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  'eagles': 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png',
  'dallas cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  'cowboys': 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png',
  'green bay packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',
  'packers': 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png',

  // MLB
  'new york yankees': 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png',
  'yankees': 'https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png',
  'los angeles dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png',
  'dodgers': 'https://a.espncdn.com/i/teamlogos/mlb/500/lad.png',
  'houston astros': 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png',
  'astros': 'https://a.espncdn.com/i/teamlogos/mlb/500/hou.png',
  'atlanta braves': 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png',
  'braves': 'https://a.espncdn.com/i/teamlogos/mlb/500/atl.png',

  // Soccer — Club teams
  'real madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/86.png',
  'barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'fc barcelona': 'https://a.espncdn.com/i/teamlogos/soccer/500/83.png',
  'manchester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'man city': 'https://a.espncdn.com/i/teamlogos/soccer/500/382.png',
  'manchester united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'man united': 'https://a.espncdn.com/i/teamlogos/soccer/500/360.png',
  'liverpool': 'https://a.espncdn.com/i/teamlogos/soccer/500/364.png',
  'arsenal': 'https://a.espncdn.com/i/teamlogos/soccer/500/359.png',
  'chelsea': 'https://a.espncdn.com/i/teamlogos/soccer/500/363.png',
  'bayern munich': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  'bayern': 'https://a.espncdn.com/i/teamlogos/soccer/500/132.png',
  'psg': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'paris saint-germain': 'https://a.espncdn.com/i/teamlogos/soccer/500/160.png',
  'juventus': 'https://a.espncdn.com/i/teamlogos/soccer/500/111.png',
  'inter milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/110.png',
  'ac milan': 'https://a.espncdn.com/i/teamlogos/soccer/500/103.png',
  'atletico madrid': 'https://a.espncdn.com/i/teamlogos/soccer/500/1068.png',
  'borussia dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'dortmund': 'https://a.espncdn.com/i/teamlogos/soccer/500/124.png',
  'tottenham': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',
  'tottenham hotspur': 'https://a.espncdn.com/i/teamlogos/soccer/500/367.png',

  // Soccer — Brazil clubs
  'flamengo': 'https://a.espncdn.com/i/teamlogos/soccer/500/819.png',
  'palmeiras': 'https://a.espncdn.com/i/teamlogos/soccer/500/2029.png',
  'corinthians': 'https://a.espncdn.com/i/teamlogos/soccer/500/874.png',
  'sao paulo': 'https://a.espncdn.com/i/teamlogos/soccer/500/2031.png',
  'santos': 'https://a.espncdn.com/i/teamlogos/soccer/500/2028.png',
  'gremio': 'https://a.espncdn.com/i/teamlogos/soccer/500/2026.png',
  'internacional': 'https://a.espncdn.com/i/teamlogos/soccer/500/2027.png',
  'atletico mineiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/2020.png',
  'botafogo': 'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png',
  'fluminense': 'https://a.espncdn.com/i/teamlogos/soccer/500/2025.png',
  'vasco': 'https://a.espncdn.com/i/teamlogos/soccer/500/2032.png',
  'cruzeiro': 'https://a.espncdn.com/i/teamlogos/soccer/500/2024.png',

  // Soccer — National teams
  'brazil': 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
  'brasil': 'https://a.espncdn.com/i/teamlogos/countries/500/bra.png',
  'argentina': 'https://a.espncdn.com/i/teamlogos/countries/500/arg.png',
  'germany': 'https://a.espncdn.com/i/teamlogos/countries/500/ger.png',
  'france': 'https://a.espncdn.com/i/teamlogos/countries/500/fra.png',
  'england': 'https://a.espncdn.com/i/teamlogos/countries/500/eng.png',
  'spain': 'https://a.espncdn.com/i/teamlogos/countries/500/esp.png',
  'portugal': 'https://a.espncdn.com/i/teamlogos/countries/500/por.png',
  'italy': 'https://a.espncdn.com/i/teamlogos/countries/500/ita.png',
  'netherlands': 'https://a.espncdn.com/i/teamlogos/countries/500/ned.png',
  'mexico': 'https://a.espncdn.com/i/teamlogos/countries/500/mex.png',
  'usa': 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
  'united states': 'https://a.espncdn.com/i/teamlogos/countries/500/usa.png',
  'uruguay': 'https://a.espncdn.com/i/teamlogos/countries/500/uru.png',
  'colombia': 'https://a.espncdn.com/i/teamlogos/countries/500/col.png',
  'japan': 'https://a.espncdn.com/i/teamlogos/countries/500/jpn.png',
  'south korea': 'https://a.espncdn.com/i/teamlogos/countries/500/kor.png',

  // Cricket — IPL Teams
  'mumbai indians': 'https://a.espncdn.com/i/teamlogos/cricket/500/4343.png',
  'chennai super kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/4344.png',
  'royal challengers bangalore': 'https://a.espncdn.com/i/teamlogos/cricket/500/4346.png',
  'royal challengers bengaluru': 'https://a.espncdn.com/i/teamlogos/cricket/500/4346.png',
  'kolkata knight riders': 'https://a.espncdn.com/i/teamlogos/cricket/500/4345.png',
  'delhi capitals': 'https://a.espncdn.com/i/teamlogos/cricket/500/4347.png',
  'rajasthan royals': 'https://a.espncdn.com/i/teamlogos/cricket/500/4348.png',
  'sunrisers hyderabad': 'https://a.espncdn.com/i/teamlogos/cricket/500/4349.png',
  'punjab kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/4350.png',
  'lucknow super giants': 'https://a.espncdn.com/i/teamlogos/cricket/500/6747.png',
  'gujarat titans': 'https://a.espncdn.com/i/teamlogos/cricket/500/6746.png',

  // Cricket — National teams
  'india': 'https://a.espncdn.com/i/teamlogos/countries/500/ind.png',
  'australia': 'https://a.espncdn.com/i/teamlogos/countries/500/aus.png',
  'new zealand': 'https://a.espncdn.com/i/teamlogos/countries/500/nzl.png',
  'pakistan': 'https://a.espncdn.com/i/teamlogos/countries/500/pak.png',
  'sri lanka': 'https://a.espncdn.com/i/teamlogos/countries/500/lka.png',
  'bangladesh': 'https://a.espncdn.com/i/teamlogos/countries/500/bgd.png',
  'west indies': 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png',
  'south africa': 'https://a.espncdn.com/i/teamlogos/countries/500/rsa.png',
  'afghanistan': 'https://a.espncdn.com/i/teamlogos/countries/500/afg.png',

  // More NFL
  'new england patriots': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
  'patriots': 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png',
  'miami dolphins': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
  'dolphins': 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png',
  'pittsburgh steelers': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
  'steelers': 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png',
  'seattle seahawks': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
  'seahawks': 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png',
  'los angeles rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  'rams': 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png',
  'los angeles chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  'chargers': 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png',
  'cincinnati bengals': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
  'bengals': 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png',
  'jacksonville jaguars': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
  'jaguars': 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png',
  'minnesota vikings': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
  'vikings': 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png',
  'chicago bears': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
  'bears': 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
  'new york giants': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
  'giants': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png',
  'new york jets': 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png',
  'cleveland browns': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
  'browns': 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png',
  'tampa bay buccaneers': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
  'buccaneers': 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png',
  'denver broncos': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
  'broncos': 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png',
  'arizona cardinals': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
  'cardinals': 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png',
  'tennessee titans': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
  'titans': 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png',
  'indianapolis colts': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
  'colts': 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png',
  'houston texans': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
  'texans': 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png',
  'new orleans saints': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
  'saints': 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png',
  'carolina panthers': 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png',
  'atlanta falcons': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
  'falcons': 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png',
  'washington commanders': 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',
  'commanders': 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png',

  // More MLB
  'new york mets': 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png',
  'mets': 'https://a.espncdn.com/i/teamlogos/mlb/500/nym.png',
  'boston red sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png',
  'red sox': 'https://a.espncdn.com/i/teamlogos/mlb/500/bos.png',
  'chicago cubs': 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png',
  'cubs': 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png',
  'philadelphia phillies': 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png',
  'phillies': 'https://a.espncdn.com/i/teamlogos/mlb/500/phi.png',
  'san diego padres': 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png',
  'padres': 'https://a.espncdn.com/i/teamlogos/mlb/500/sd.png',
  'texas rangers': 'https://a.espncdn.com/i/teamlogos/mlb/500/tex.png',

  // More Soccer
  'napoli': 'https://a.espncdn.com/i/teamlogos/soccer/500/114.png',
  'benfica': 'https://a.espncdn.com/i/teamlogos/soccer/500/1903.png',
  'porto': 'https://a.espncdn.com/i/teamlogos/soccer/500/1Portal.png',
  'sporting cp': 'https://a.espncdn.com/i/teamlogos/soccer/500/2006.png',
  'ajax': 'https://a.espncdn.com/i/teamlogos/soccer/500/139.png',
  'boca juniors': 'https://a.espncdn.com/i/teamlogos/soccer/500/5765.png',
  'river plate': 'https://a.espncdn.com/i/teamlogos/soccer/500/5766.png',
  'aston villa': 'https://a.espncdn.com/i/teamlogos/soccer/500/362.png',
  'newcastle': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'newcastle united': 'https://a.espncdn.com/i/teamlogos/soccer/500/361.png',
  'west ham': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
  'west ham united': 'https://a.espncdn.com/i/teamlogos/soccer/500/371.png',
  'leicester city': 'https://a.espncdn.com/i/teamlogos/soccer/500/375.png',
  'everton': 'https://a.espncdn.com/i/teamlogos/soccer/500/368.png',
  'wolverhampton': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',
  'wolves': 'https://a.espncdn.com/i/teamlogos/soccer/500/380.png',

  // ── NCAA Basketball ──
  'duke': 'https://a.espncdn.com/i/teamlogos/ncaa/500/150.png',
  'duke blue devils': 'https://a.espncdn.com/i/teamlogos/ncaa/500/150.png',
  'michigan': 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png',
  'michigan wolverines': 'https://a.espncdn.com/i/teamlogos/ncaa/500/130.png',
  'arizona': 'https://a.espncdn.com/i/teamlogos/ncaa/500/12.png',
  'arizona wildcats': 'https://a.espncdn.com/i/teamlogos/ncaa/500/12.png',
  'florida': 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png',
  'florida gators': 'https://a.espncdn.com/i/teamlogos/ncaa/500/57.png',
  'houston': 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png',
  'houston cougars': 'https://a.espncdn.com/i/teamlogos/ncaa/500/248.png',
  'iowa state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png',
  'iowa state cyclones': 'https://a.espncdn.com/i/teamlogos/ncaa/500/66.png',
  'purdue': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png',
  'purdue boilermakers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png',
  'illinois': 'https://a.espncdn.com/i/teamlogos/ncaa/500/356.png',
  'illinois fighting illini': 'https://a.espncdn.com/i/teamlogos/ncaa/500/356.png',
  'connecticut': 'https://a.espncdn.com/i/teamlogos/ncaa/500/41.png',
  'uconn': 'https://a.espncdn.com/i/teamlogos/ncaa/500/41.png',
  'uconn huskies': 'https://a.espncdn.com/i/teamlogos/ncaa/500/41.png',
  'michigan state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/127.png',
  'michigan state spartans': 'https://a.espncdn.com/i/teamlogos/ncaa/500/127.png',
  'gonzaga': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png',
  'gonzaga bulldogs': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png',
  'arkansas': 'https://a.espncdn.com/i/teamlogos/ncaa/500/8.png',
  'arkansas razorbacks': 'https://a.espncdn.com/i/teamlogos/ncaa/500/8.png',
  'kansas': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png',
  'kansas jayhawks': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png',
  'st johns': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2599.png',
  "st john's": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2599.png',
  'virginia': 'https://a.espncdn.com/i/teamlogos/ncaa/500/258.png',
  'virginia cavaliers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/258.png',
  'vanderbilt': 'https://a.espncdn.com/i/teamlogos/ncaa/500/238.png',
  'vanderbilt commodores': 'https://a.espncdn.com/i/teamlogos/ncaa/500/238.png',
  'tennessee': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png',
  'tennessee volunteers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png',
  'wisconsin': 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',
  'wisconsin badgers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/275.png',
  'ucla': 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
  'ucla bruins': 'https://a.espncdn.com/i/teamlogos/ncaa/500/26.png',
  'louisville': 'https://a.espncdn.com/i/teamlogos/ncaa/500/97.png',
  'louisville cardinals': 'https://a.espncdn.com/i/teamlogos/ncaa/500/97.png',
  'alabama': 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png',
  'alabama crimson tide': 'https://a.espncdn.com/i/teamlogos/ncaa/500/333.png',
  'nebraska': 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png',
  'nebraska cornhuskers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/158.png',
  'byu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/252.png',
  'byu cougars': 'https://a.espncdn.com/i/teamlogos/ncaa/500/252.png',
  'texas tech': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png',
  'texas tech red raiders': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png',
  'south florida': 'https://a.espncdn.com/i/teamlogos/ncaa/500/58.png',
  'usf bulls': 'https://a.espncdn.com/i/teamlogos/ncaa/500/58.png',
  'kentucky': 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png',
  'kentucky wildcats': 'https://a.espncdn.com/i/teamlogos/ncaa/500/96.png',
  'tcu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png',
  'tcu horned frogs': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2628.png',
  'north carolina': 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png',
  'unc tar heels': 'https://a.espncdn.com/i/teamlogos/ncaa/500/153.png',
  'ohio state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png',
  'ohio state buckeyes': 'https://a.espncdn.com/i/teamlogos/ncaa/500/194.png',
  'utah state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/328.png',
  'saint louis': 'https://a.espncdn.com/i/teamlogos/ncaa/500/139.png',
  'texas am': 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
  'texas a&m': 'https://a.espncdn.com/i/teamlogos/ncaa/500/245.png',
  'nc state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/152.png',
  'nc state wolfpack': 'https://a.espncdn.com/i/teamlogos/ncaa/500/152.png',
  'santa clara': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2541.png',
  'santa clara broncos': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2541.png',
  "st marys": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2608.png',
  "st. mary's": 'https://a.espncdn.com/i/teamlogos/ncaa/500/2608.png',
  'missouri': 'https://a.espncdn.com/i/teamlogos/ncaa/500/142.png',
  'missouri tigers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/142.png',
  'miami fl': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png',
  'miami (fl)': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2390.png',
  'villanova': 'https://a.espncdn.com/i/teamlogos/ncaa/500/222.png',
  'villanova wildcats': 'https://a.espncdn.com/i/teamlogos/ncaa/500/222.png',
  'iowa': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png',
  'iowa hawkeyes': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2294.png',
  'georgia': 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
  'georgia bulldogs': 'https://a.espncdn.com/i/teamlogos/ncaa/500/61.png',
  'high point': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2272.png',
  'high point panthers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2272.png',
  'akron': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2006.png',
  'akron zips': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2006.png',
  'clemson': 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
  'clemson tigers': 'https://a.espncdn.com/i/teamlogos/ncaa/500/228.png',
  'texas': 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png',
  'texas longhorns': 'https://a.espncdn.com/i/teamlogos/ncaa/500/251.png',
  'smu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2567.png',
  'smu mustangs': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2567.png',
  'ucf': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2116.png',
  'ucf knights': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2116.png',
  'vcu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2670.png',
  'vcu rams': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2670.png',
  'hofstra': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2275.png',
  'siena': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2561.png',
  'miami oh': 'https://a.espncdn.com/i/teamlogos/ncaa/500/193.png',
  'miami (oh)': 'https://a.espncdn.com/i/teamlogos/ncaa/500/193.png',
  'lehigh': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2329.png',
  'furman': 'https://a.espncdn.com/i/teamlogos/ncaa/500/231.png',
  'wright state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2750.png',
  'troy': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2653.png',
  'tennessee state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2634.png',
  'mcneese': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2377.png',
  'mcneese state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2377.png',
  'north dakota state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2449.png',
  'howard': 'https://a.espncdn.com/i/teamlogos/ncaa/500/47.png',
  'kennesaw state': 'https://a.espncdn.com/i/teamlogos/ncaa/500/338.png',
  'northern iowa': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2460.png',
  'norhtern iowa': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2460.png',
  'cal baptist': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2856.png',
  'penn': 'https://a.espncdn.com/i/teamlogos/ncaa/500/219.png',
  'hawaii': 'https://a.espncdn.com/i/teamlogos/ncaa/500/62.png',
  'queens': 'https://a.espncdn.com/i/teamlogos/ncaa/500/3593.png',
  'prairie view am': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2504.png',
  'prairie view a&m': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2504.png',
  'idaho': 'https://a.espncdn.com/i/teamlogos/ncaa/500/70.png',
  'liu': 'https://a.espncdn.com/i/teamlogos/ncaa/500/112.png',
};

export function proxyImage(url: string | undefined | null): string {
  if (!url) return '';
  let normalizedUrl = url.trim();

  // Some routes may pass pre-encoded image URLs; decode once when needed.
  if (/^https?%3a/i.test(normalizedUrl)) {
    try {
      normalizedUrl = decodeURIComponent(normalizedUrl);
    } catch {
      // keep original if decode fails
    }
  }

  // Skip local/data/blob/relative URLs
  if (normalizedUrl.startsWith('/') || normalizedUrl.startsWith('data:') || normalizedUrl.startsWith('blob:') || !normalizedUrl.startsWith('http')) return normalizedUrl;

  try {
    const hostname = new URL(normalizedUrl).hostname;
    // Avoid proxy chaining
    if (hostname.includes('wsrv.nl') || hostname.includes('images.weserv.nl')) return normalizedUrl;
  } catch { return normalizedUrl; }

  // Proxy all external URLs through wsrv.nl to avoid hotlink/CORS blocks
  return `https://wsrv.nl/?url=${encodeURIComponent(normalizedUrl)}&default=1&n=-1`;
}

/**
 * Global image error handler — retries failed images with/without proxy,
 * and hides the element if all attempts fail.
 */
export function setupGlobalImageErrorHandler() {
  if (typeof document === 'undefined') return;

  document.addEventListener('error', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;

    const src = target.src;
    const retries = parseInt(target.dataset.imgRetry || '0', 10);

    if (retries >= 2) {
      // All retries exhausted — hide the image gracefully
      target.style.display = 'none';
      return;
    }

    target.dataset.imgRetry = String(retries + 1);

    if (retries === 0) {
      // First failure: if it was proxied, try direct; if direct, try proxied
      if (src.includes('wsrv.nl')) {
        // Extract original URL from proxy
        try {
          const proxyUrl = new URL(src);
          const originalUrl = proxyUrl.searchParams.get('url');
          if (originalUrl) {
            target.src = originalUrl;
            return;
          }
        } catch { /* fall through */ }
      } else if (src.startsWith('http')) {
        // Try proxying it
        target.src = `https://wsrv.nl/?url=${encodeURIComponent(src)}&default=1&n=-1`;
        return;
      }
    }

    // Second failure or fallback: hide the element
    target.style.display = 'none';
  }, true); // capture phase to catch all img errors
}

function normalizeComparableUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').toLowerCase();
}

export function getOptionImageSource(
  option: { icon?: string | null; image?: string | null } | null | undefined,
  eventImage?: string | null
): string | null {
  const icon = option?.icon?.trim() || '';
  const image = option?.image?.trim() || '';
  const event = eventImage?.trim() || '';

  // If icon is just the same event cover, prefer the specific option image.
  if (icon && image && event && normalizeComparableUrl(icon) === normalizeComparableUrl(event)) {
    return image;
  }

  return icon || image || event || null;
}

/**
 * Look up a better image for a label (team name, politician name, etc.)
 * Returns the override URL or null if no match found.
 */
export function getImageOverride(label: string): string | null {
  const key = normalizeKey(label);
  
  // Check politicians first (exact match)
  if (POLITICIAN_IMAGES[key]) return POLITICIAN_IMAGES[key];
  
  // Check teams (exact match)
  if (TEAM_LOGOS[key]) return TEAM_LOGOS[key];
  
  // Partial match: check if key contains a known team/politician name
  for (const [name, url] of Object.entries(POLITICIAN_IMAGES)) {
    if (key.includes(name) || name.includes(key)) return url;
  }
  for (const [name, url] of Object.entries(TEAM_LOGOS)) {
    if (name.length >= 4 && (key.includes(name) || name.includes(key))) return url;
  }
  
  return null;
}

/**
 * Override option images in a market's options array.
 * Returns new options with better images where available.
 */
export function overrideOptionImages<T extends { label: string; image?: string; icon?: string }>(options: T[]): T[] {
  return options.map(opt => {
    const override = getImageOverride(opt.label);
    if (override) return { ...opt, icon: opt.icon || override, image: override };
    return opt;
  });
}

/**
 * Try to find a better market-level image based on the market question text.
 * Returns override URL or the original imageUrl.
 */
export function getMarketImageOverride(question: string, currentImageUrl: string): string {
  const key = normalizeKey(question);
  
  // Check if question mentions a known entity
  for (const [name, url] of Object.entries(POLITICIAN_IMAGES)) {
    if (name.length >= 4 && key.includes(name)) return url;
  }
  for (const [name, url] of Object.entries(TEAM_LOGOS)) {
    if (name.length >= 5 && key.includes(name)) return url;
  }
  
  return currentImageUrl;
}
