import type {CSSProperties, FC} from 'react';
import {AbsoluteFill, Audio, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {TemplateVideo} from '../../templates/TemplateVideo';
import type {VideoConfig} from '../../templates/types';
import {colors, easeOutExpo, fonts} from '../../theme';
import {coastline} from './coastline';

const museum = 'Британский музей · EA24';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const paper = '#dec8a0';
const ink = '#302118';

type Shot = {
  title: string;
  detail: string;
  label?: string;
  image?: string;
  credit?: string;
  video?: boolean;
  placement?: 'right' | 'left' | 'wide' | 'inset';
  position?: string;
  background: string;
  light?: boolean;
  graphic?: 'map' | 'decree' | 'scripts' | 'cartouche' | 'timeline';
};

export const shots: Shot[] = [
  {label:'Science History', title:'Розеттский\nкамень', detail:'Как прочитали египетские иероглифы', image:'stone', credit: museum+' · Hans Hillewaert / CC BY-SA 4.0', placement:'right', position:'center 38%', background:'#17120e'},
  {label:'Египет · июль 1799 года', title:'Находка\nу форта', detail:'Французские солдаты нашли камень при работах у форта Жюльен.', image:'fort', credit:'Гравюра из книги Уильяма Уиттмана · 1803 / PD', placement:'wide', position:'center 45%', background:'#574031'},
  {label:'Дельта Нила', title:'Рашид', detail:'Город также известен как Розетта.', graphic:'map', credit:'Схема · береговая линия Natural Earth / PD', background:'#263c42'},
  {label:'Розеттский камень · 196 г. до н. э.', title:'Обломок\nстелы', detail:'На лицевой стороне высечен указ о царе Птолемее V.', image:'side', credit: museum+' · Andres Rueda / CC BY 2.0', placement:'left', position:'center 28%', background:'#39372d'},
  {label:'Мемфисский декрет', title:'196', detail:'год до н. э. · жрецы приняли указ о Птолемее V', graphic:'decree', credit:'Схема по данным Британского музея', background:paper, light:true},
  {label:'Надпись · верхняя часть', title:'Иероглифы', detail:'Верхние строки сохранились лишь частично.', image:'detail', credit: museum+' · ProtoplasmaKid / CC BY-SA 4.0', placement:'wide', position:'center 26%', background:'#3c2b20'},
  {label:'Надпись · средняя часть', title:'Демотика', detail:'Египетское письмо повседневных документов.', image:'bw', credit: museum+' · историческое изображение / PD', placement:'right', position:'center 44%', background:'#c4ae85', light:true},
  {label:'Надпись · нижняя часть', title:'Древнегреческий', detail:'Греческий текст дал учёным точку опоры.', image:'print', credit:'Музей Шампольона · Julien Peytard / CC BY-SA 4.0', placement:'left', position:'center 75%', background:'#591e17'},
  {label:'Строение надписи', title:'Один указ', detail:'Два языка, три вида письма', graphic:'scripts', credit:'Схема по данным Британского музея', background:'#c8b797', light:true},
  {label:'Томас Юнг', title:'Имя было\nподсказкой', detail:'Юнг связал часть знаков со звуками имени Птолемея.', image:'young', credit:'Генри Адлард · National Portrait Gallery, NPG 1899D7714 / PD', placement:'inset', background:'#2a342d'},
  {label:'Принцип чтения', title:'Картуш', detail:'Овальная рамка выделяет царское имя.', graphic:'cartouche', credit:'Условная схема по данным Британского музея', background:'#6d3022'},
  {label:'Жан-Франсуа Шампольон', title:'Прорыв\nв 1822 году', detail:'Он показал, что знаки передают звуки и в египетских именах.', image:'champ', credit:'Портрет из книги Гермины Хартлебен · 1906 / PD', placement:'left', position:'center 28%', background:'#b8a480', light:true},
  {label:'Расшифровка заняла десятилетия', title:'От находки\nк чтению', detail:'Между находкой и докладом Шампольона прошло 23 года.', graphic:'timeline', credit:'Хронология по данным Британского музея', background:'#223639'},
  {label:'Иероглифы на египетском памятнике', title:'Письмо снова\nможно читать', detail:'Расшифровка открыла путь к чтению других надписей.', video:true, credit:'Артём Старшинов / Pexels License', placement:'wide', background:'#7d6344'},
  {label:'Британский музей · Лондон', title:'Розеттский\nкамень', detail:'Сегодня стела хранится в Британском музее.', image:'boy', credit: museum+' · Adrian Grycuk / CC BY-SA 3.0 PL', placement:'wide', position:'center 46%', background:'#211910'},
];

const PaleDivider: FC<{progress: number; light?: boolean}> = ({progress, light}) =>
  <div style={{height:3, width:104*progress, background:light ? colors.hot : colors.accent, marginBottom:25}} />;

const MapGraphic: FC<{progress: number}> = ({progress}) => (
  <svg viewBox="0 0 1080 850" width={1080} height={850} style={{position:'absolute', right:0, top:86, overflow:'hidden'}}>
    <g transform={`translate(${-94-26*progress}, -73) scale(1.12)`}>
      <path d={coastline} fill="#99845c" stroke="#ddc598" strokeWidth={2} />
      <path d="M785 831 Q773 690 802 640 T790 580 L739 560" fill="none" stroke="#516f77" strokeWidth={5} />
      <path d="M790 580 L813 554" fill="none" stroke="#516f77" strokeWidth={4} />
      <circle cx="736" cy="560" r={22+17*progress} fill="none" stroke={colors.accent} strokeWidth={2} />
      <circle cx="736" cy="560" r={8} fill={colors.accent} />
      <path d="M736 551 L720 482 H608" fill="none" stroke={colors.accent} strokeWidth={2} />
      <text x="603" y="468" textAnchor="end" fill={colors.text} fontFamily={fonts.body} fontSize={30}>Рашид</text>
      <text x="348" y="374" fill="#b1c4c5" fontFamily={fonts.body} fontSize={29}>Средиземное море</text>
      <text x="564" y="697" fill={ink} fontFamily={fonts.body} fontSize={26}>Египет</text>
    </g>
  </svg>
);

const Diagram: FC<{shot: Shot; progress: number}> = ({shot,progress}) => {
  if (shot.graphic === 'map') return <MapGraphic progress={progress} />;
  if (shot.graphic === 'decree') return (
    <svg viewBox="0 0 960 1080" width={960} height={1080} style={{position:'absolute', right:0}}>
      <path d="M392 0H960V1080H57Z" fill="#852f22"/>
      {[195, 260, 325].map((radius) => <circle key={radius} cx="604" cy="540" r={radius*progress} fill="none" stroke="#d8b986" strokeWidth={1.5}/>)}
      <text x="604" y="580" textAnchor="middle" fill={colors.text} fontFamily={fonts.display} fontSize="88">V</text>
      <text x="604" y="632" textAnchor="middle" fill={colors.text} fontFamily={fonts.body} fontSize="29">Птолемей</text>
    </svg>
  );
  if (shot.graphic === 'scripts') return (
    <div style={{position:'absolute', top:195, left:870, right:120, fontFamily:fonts.body, color:ink}}>
      {['Иероглифы','Демотика','Древнегреческое письмо'].map((name,i) =>
        <div key={name} style={{padding:'32px 36px', background:['#4c2a22','#6e5742','#355056'][i], color:colors.text, fontSize:39, marginBottom:14, width:[635,735,850][i], opacity:progress, transform:`translateX(${(1-progress)*(i+1)*30}px)`}}>
          <span style={{fontSize:25, marginRight:24, color:'#e3ba74'}}>0{i+1}</span>{name}
          <div style={{fontSize:26, marginLeft:56, marginTop:3}}>{i<2?'Египетский язык':'Древнегреческий язык'}</div>
        </div>)}
    </div>
  );
  if (shot.graphic === 'cartouche') return (
    <svg viewBox="0 0 1000 670" width={1000} height={670} style={{position:'absolute', right:85, top:200}}>
      <path d="M0 0H1000V670H0Z" fill="#d1ac75"/>
      <g transform={`translate(500 335) scale(${0.92+progress*0.08}) translate(-500 -335)`}>
        <rect x="95" y="223" width="800" height="218" rx="109" fill="none" stroke="#54372a" strokeWidth="8" />
        <path d="M898 247V417" stroke="#54372a" strokeWidth="8" />
        <text x="490" y="352" textAnchor="middle" fontFamily={fonts.display} fontSize="61" fill={ink}>Птолемей</text>
      </g>
      <text x="500" y="541" textAnchor="middle" fontFamily={fonts.body} fontSize="26" fill={ink}>Имя показано по-русски</text>
    </svg>
  );
  return (
    <svg viewBox="0 0 1070 620" width={1070} height={620} style={{position:'absolute', right:82, top:215}}>
      <path d="M94 426H1000" stroke="#75908e" strokeWidth={3} />
      <path d={`M94 426H${94+906*progress}`} stroke={colors.accent} strokeWidth={6} />
      {[{x:94,year:'1799',label:'Находка'},{x:1000,year:'1822',label:'Доклад'}].map(({x,year,label}) =>
        <g key={year} textAnchor={x===94?'start':'end'} fontFamily={fonts.body}>
          <circle cx={x} cy="426" r={10} fill={colors.accent}/>
          <text x={x} y="386" fill={colors.text} fontFamily={fonts.display} fontSize="65">{year}</text>
          <text x={x} y="480" fill={colors.text} fontSize="31">{label}</text>
        </g>)}
    </svg>
  );
};

const photoLayouts: Record<NonNullable<Shot['placement']>, CSSProperties> = {
  right:{left:880, right:0, top:0, bottom:0},
  left:{left:0, width:854, top:0, bottom:0},
  wide:{inset:0},
  inset:{left:942, width:785, top:50, bottom:0},
};

const ShotView: FC<{shot: Shot; index: number}> = ({shot,index}) => {
  const frame = useCurrentFrame();
  const t = frame/132;
  const reveal = easeOutExpo(interpolate(frame,[3,36],[0,1],clamp));
  const wide = shot.placement === 'wide';
  const left = shot.placement === 'left';
  const finish = index === shots.length - 1;
  const chapter = index === 4 || index === 9;
  const flare = interpolate(frame, [0, 8, 22], [0, 0.48, 0], clamp);
  const textColor = shot.light ? ink : colors.text;
  const textTop = wide ? (finish ? 535 : 570) : 350;
  const panel = shot.placement ? photoLayouts[shot.placement] : undefined;
  const imageStyle: CSSProperties = {
    height:'100%', width:'100%', objectFit:'cover', objectPosition:shot.position ?? 'center 30%',
    transform:`scale(${1.025+0.095*t}) translateX(${(left?-1:1)*(8-16*t)}px)`,
    filter:'contrast(1.08) saturate(0.85)',
  };

  return (
    <AbsoluteFill style={{background:shot.background,color:textColor,fontFamily:fonts.body,overflow:'hidden'}}>
      {panel ? (
        <div style={{position:'absolute',overflow:'hidden',...panel}}>
          {shot.video
            ? <OffthreadVideo muted src={staticFile('footage/rosetta/hieroglyphs.mp4')} style={imageStyle} />
            : <Img src={staticFile(`images/rosetta/${shot.image}.jpg`)} style={imageStyle} />}
          <AbsoluteFill style={{background:wide
            ? 'linear-gradient(90deg,rgba(14,11,8,.7),transparent 78%),linear-gradient(0deg,#0e0b08 2%,rgba(14,11,8,.4) 41%,transparent 64%)'
            : 'linear-gradient(0deg,rgba(14,11,8,.48),transparent 33%)'}} />
        </div>
      ) : <Diagram shot={shot} progress={0.6+reveal*0.4} />}
      <div style={{position:'absolute',top:textTop,left:left?965:120,width:left?830:(wide?1375:780),opacity:reveal,transform:`translateY(${24*(1-reveal)}px)`}}>
        <PaleDivider progress={reveal} light={shot.light} />
        <div style={{fontSize:27, fontWeight:800, letterSpacing:1.4, color:shot.light?'#6a2f23':'#f0ca85', marginBottom:17}}>{shot.label}</div>
        <div style={{whiteSpace:'pre-line', fontFamily:fonts.display,fontSize:shot.graphic==='decree'?206:wide?80:index===7?58:index===8?69:75,lineHeight:0.99,letterSpacing:-2,fontWeight:500}}>{shot.title}</div>
        <div style={{marginTop:24, fontSize:35, maxWidth:left?765:wide?1040:710, fontWeight:600,lineHeight:1.2}}>{shot.detail}</div>
      </div>
      <div style={{position:'absolute',bottom:91,left:left?965:120,maxWidth:left?825:1340,fontSize:23,fontWeight:700,color:wide?'#f2eadb':textColor,opacity:0.89}}>
        {shot.credit}
      </div>
      {chapter ? (
        <>
          <AbsoluteFill style={{
            background: 'radial-gradient(ellipse at 14% 50%, #ffdd9f, #cc6728 26%, transparent 69%)',
            mixBlendMode: 'screen',
            opacity: flare,
          }} />
          <Audio src={staticFile('audio/whoosh.wav')} volume={0.40} />
        </>
      ) : null}
      {finish ? <AbsoluteFill style={{background:'#000', opacity:interpolate(frame,[105,119],[0,1],clamp)}} /> : null}
    </AbsoluteFill>
  );
};

export const rosettaConfig: VideoConfig = {
  id:'RosettaStone',
  music:{src:'audio/ambient.mp3',volume:0.9},
  sfx:{hit:'audio/hit.wav'},
  cut:'crossfade',
  crossfadeFrames:12,
  extraHits:[494,1338],
  scenes:shots.map((shot,index) => ({
    type:'custom',
    durationInFrames:index===shots.length-1?120:132,
    component:() => <ShotView shot={shot} index={index} />,
  })),
};

export const RosettaStone: FC = () => <TemplateVideo config={rosettaConfig} />;
