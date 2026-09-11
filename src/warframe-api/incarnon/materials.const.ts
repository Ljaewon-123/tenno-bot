import { IncarnonMaterial } from './types';

/**
 * 인카논 제네시스 설치 재료. 어댑터 uniqueName -> 재료 3종.
 *
 * 퍽과 달리 이건 위키를 파싱하지 않는다 — DE Public Export의 `ExportRecipes.json`
 * (`IncarnonAdapters/UnlockerBlueprints/*`)에 45개가 구조화돼 있어서 그걸 그대로 옮겼다.
 * 레시피에는 어댑터 자신도 재료로 들어 있지만 표시할 게 아니라 뺐다.
 * 재료 이름·아이콘은 여기 두지 않는다 — uniqueName으로 `WfcdItemsService`가 붙인다(180/180 해석됨).
 *
 * 새 인카논이 추가될 때만(연 2~3회) 다시 뽑으면 된다. 뽑는 법은 위 경로를 필터링하는 게 전부다.
 */
export const INCARNON_MATERIALS: Record<string, IncarnonMaterial[]> = {
  // Ack & Brunt Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/AckAndBruntIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartBItem',
        count: 300,
      },
    ],
  // Angstrum Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/AngstrumIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemG',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
        count: 80,
      },
    ],
  // Anku Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/AnkuIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemG',
      count: 70,
    },
    {
      uniqueName:
        '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartBItem',
      count: 300,
    },
  ],
  // Atomos Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/AtomosIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
        count: 80,
      },
    ],
  // Ballistica Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/BallisticaIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemA',
        count: 80,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemE',
        count: 60,
      },
    ],
  // Bo Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/BoIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
      count: 70,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemA',
      count: 80,
    },
  ],
  // Boar Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/BoarIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Boltor Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/BoltorIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemE',
        count: 60,
      },
    ],
  // Braton Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/BratonIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Bronco Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/BroncoIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartAItem',
        count: 100,
      },
    ],
  // Burston Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/BurstonIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartCItem',
        count: 20,
      },
    ],
  // Ceramic Dagger Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/CeramicDaggerIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemC',
        count: 80,
      },
    ],
  // Cestra Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/CestraIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemA',
        count: 80,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriProcessedItem',
        count: 150,
      },
    ],
  // Dera Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/DeraIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemB',
        count: 80,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemG',
        count: 70,
      },
    ],
  // Despair Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/DespairIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemE',
        count: 60,
      },
    ],
  // Destreza Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/DestrezaIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
    ],
  // Dread Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/DreadIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Dual Ichor Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/DualIchorIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemA',
        count: 80,
      },
    ],
  // Dual Toxocyst Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/DualToxocystIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemB',
        count: 80,
      },
    ],
  // Furax Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/FuraxIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
      count: 70,
    },
    {
      uniqueName:
        '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartBItem',
      count: 300,
    },
  ],
  // Furis Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/FurisIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
        count: 80,
      },
    ],
  // Gammacor Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/GammacorIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemG',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
        count: 80,
      },
    ],
  // Gorgon Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/GorgonIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Hate Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/HateIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
      count: 70,
    },
    {
      uniqueName:
        '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartCItem',
      count: 20,
    },
  ],
  // Kunai Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/KunaiIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemB',
        count: 80,
      },
    ],
  // Lato Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/LatoIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartAItem',
        count: 100,
      },
    ],
  // Latron Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/LatronIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartCItem',
        count: 20,
      },
    ],
  // Lex Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/LexIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriProcessedItem',
        count: 150,
      },
    ],
  // Magistar Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/MagistarIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriRockItem',
        count: 150,
      },
    ],
  // Miter Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/MiterIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Nami Solo Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/NamiSoloIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriRockItem',
        count: 150,
      },
    ],
  // Obex Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/ObexIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName:
        '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartAItem',
      count: 100,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
      count: 80,
    },
  ],
  // Okina Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/OkinaIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName:
        '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartCItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriEnemyDropItem',
      count: 80,
    },
  ],
  // Paris Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/ParisIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemE',
        count: 60,
      },
    ],
  // Sibear Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/SibearIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemC',
        count: 80,
      },
    ],
  // Sicarus Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/SicarusIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartAItem',
        count: 100,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriRockItem',
        count: 150,
      },
    ],
  // Skana Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Melee/SkanaIncarnonUnlocker': [
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
      count: 20,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemF',
      count: 70,
    },
    {
      uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemC',
      count: 80,
    },
  ],
  // Soma Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/SomaIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemE',
        count: 60,
      },
    ],
  // Strun Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/StrunIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
    ],
  // Stug Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/StugIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriMushroomItem',
        count: 60,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriRockItem',
        count: 150,
      },
    ],
  // Sybaris Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/SybarisIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemG',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriProcessedItem',
        count: 150,
      },
    ],
  // Torid Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/ToridIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriFractalItem',
        count: 60,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartCItem',
        count: 20,
      },
    ],
  // Vasto Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/VastoIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriProcessedItem',
        count: 150,
      },
    ],
  // Vectis Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Primary/VectisIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemB',
        count: 80,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriProcessedItem',
        count: 150,
      },
    ],
  // Zylok Incarnon Genesis
  '/Lotus/Types/Items/MiscItems/IncarnonAdapters/Secondary/ZylokIncarnonUnlocker':
    [
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/DuviriDragonDropItem',
        count: 20,
      },
      {
        uniqueName: '/Lotus/Types/Gameplay/Duviri/Resource/DuviriPlantItemD',
        count: 70,
      },
      {
        uniqueName:
          '/Lotus/Types/Gameplay/Duviri/Resource/Fish/GenericDuviriFishPartAItem',
        count: 100,
      },
    ],
};
