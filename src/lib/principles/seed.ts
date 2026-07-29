export type PrincipleCategory =
  | "environment"
  | "urge"
  | "tracking"
  | "sleep_food"
  | "structure"
  | "self_talk"
  | "support";

export const PRINCIPLE_CATEGORY_LABELS: Record<PrincipleCategory, string> = {
  environment: "Environment",
  urge: "Urge protocol",
  tracking: "Tracking",
  sleep_food: "Sleep & food",
  structure: "Structure & movement",
  self_talk: "Self-talk & recovery",
  support: "Support & faith",
};

export const PRINCIPLE_CATEGORY_ORDER: PrincipleCategory[] = [
  "environment",
  "urge",
  "tracking",
  "sleep_food",
  "structure",
  "self_talk",
  "support",
];

export type PrincipleSeedItem = {
  text: string;
  category: PrincipleCategory;
  sortOrder: number;
};

/** Default guardrails (Turkish). Seeded once when a user has no principles. */
export const DEFAULT_PRINCIPLES: PrincipleSeedItem[] = [
  { sortOrder: 1, category: "environment", text: "Sosyal medya için günlük belirli bir süre sınırı koy." },
  { sortOrder: 2, category: "environment", text: "Amaçsızca internette gezinme." },
  { sortOrder: 3, category: "environment", text: "Telefonu yatak odasına ve tuvalete götürme." },
  { sortOrder: 4, category: "environment", text: "Telefonu gece başka bir odada şarj et." },
  { sortOrder: 5, category: "environment", text: "Yatakta telefon, bilgisayar veya sosyal medya kullanma." },
  { sortOrder: 6, category: "environment", text: "Bilgisayarı mümkün olduğunca açık veya ortak bir alanda kullan." },
  { sortOrder: 7, category: "environment", text: "Tetikleyici bir görüntüyle karşılaştığında tekrar bakma." },
  { sortOrder: 8, category: "environment", text: "Dikkatini insanların bedenlerine değil, yüzlerine veya yaptığın işe yönelt." },
  { sortOrder: 9, category: "environment", text: "Spor salonunda hareketlerine, tekrarlarına ve dinlenme sürelerine odaklan." },
  { sortOrder: 10, category: "environment", text: "Yolculuklarda kitap, sesli içerik veya başka bir uğraş hazır bulundur." },

  { sortOrder: 11, category: "urge", text: "Dürtünün bir emir değil, geçici bir his olduğunu hatırla." },
  { sortOrder: 12, category: "urge", text: "Dürtü geldiğinde ayağa kalk ve bulunduğun ortamı değiştir." },
  { sortOrder: 13, category: "urge", text: "Ekranı kapat ve telefonu başka bir odaya bırak." },
  { sortOrder: 14, category: "urge", text: "Dürtünün şiddetini 0 ile 10 arasında değerlendir." },
  { sortOrder: 15, category: "urge", text: "İstenmeyen davranışı en az 15 dakika ertele." },
  { sortOrder: 16, category: "urge", text: "Bu sırada yürü, abdest al, namaz kıl, ev işi yap veya birini ara." },
  { sortOrder: 17, category: "urge", text: "On beş dakika sonra dürtünün şiddetini yeniden değerlendir." },
  { sortOrder: 18, category: "urge", text: "Dürtü hâlâ yüksekse yalnız kalma ve internet erişiminden uzaklaş." },

  { sortOrder: 19, category: "tracking", text: "Her ciddi dürtüde saat, yer, duygu ve tetikleyiciyi not et." },
  { sortOrder: 20, category: "tracking", text: "Yalnızlık, stres, can sıkıntısı, öfke ve yorgunluğu özellikle takip et." },
  { sortOrder: 21, category: "tracking", text: "“Sadece kısa süre bakacağım” düşüncesini erken uyarı olarak kabul et." },

  { sortOrder: 22, category: "sleep_food", text: "Her gün yaklaşık aynı saatte yat ve kalk." },
  { sortOrder: 23, category: "sleep_food", text: "Uyumadan önceki son bir saatte ekran kullanma." },
  { sortOrder: 24, category: "sleep_food", text: "Uykusuz kaldığın günlerde daha dikkatli ol." },
  { sortOrder: 25, category: "sleep_food", text: "Düzenli ve yeterli yemek ye." },
  { sortOrder: 26, category: "sleep_food", text: "Kendini aç bırakma veya tıka basa doyurma." },
  { sortOrder: 27, category: "sleep_food", text: "Fazla yemek sonrasında kendine zarar verebilecek telafi davranışlarına başvurma." },
  { sortOrder: 28, category: "sleep_food", text: "Bir aksama sonrasında kendini açlıkla veya aşırı sporla cezalandırma." },
  { sortOrder: 29, category: "sleep_food", text: "Atıştırmalıkları paketinden yemek yerine uygun miktarda ayır." },

  { sortOrder: 30, category: "structure", text: "Her gün en az 10 dakika dışarı çık veya yürü." },
  { sortOrder: 31, category: "structure", text: "Haftada birkaç gün düzenli egzersiz yap." },
  { sortOrder: 32, category: "structure", text: "Egzersizi kendini cezalandırma yöntemi olarak kullanma." },
  { sortOrder: 33, category: "structure", text: "Evde uzun süre amaçsız ve yalnız kalmamaya dikkat et." },
  { sortOrder: 34, category: "structure", text: "Her gün için iş, hareket ve insan iletişimi içeren bir düzen oluştur." },
  { sortOrder: 35, category: "structure", text: "Can sıkıntısı için önceden alternatif etkinlikler belirle." },
  { sortOrder: 36, category: "structure", text: "Zor bir işten kaçma isteği geldiğinde işe yalnızca beş dakikalığına başla." },

  { sortOrder: 37, category: "self_talk", text: "Kendini başkalarıyla kıyaslama." },
  { sortOrder: 38, category: "self_talk", text: "İlerlemeni geçmişteki hâlinle karşılaştır." },
  { sortOrder: 39, category: "self_talk", text: "Davranışını değerlendirebilirsin; fakat kişiliğini aşağılamamalısın." },
  { sortOrder: 40, category: "self_talk", text: "Tek bir aksamayı “her şey bitti” şeklinde yorumlama." },
  { sortOrder: 41, category: "self_talk", text: "Bir aksama olursa mümkün olan ilk anda dur." },
  { sortOrder: 42, category: "self_talk", text: "Aksamaya yol açan tetikleyiciyi yaz ve erişim yolunu kapat." },
  { sortOrder: 43, category: "self_talk", text: "Ertesi gün normal düzenine geri dön." },
  { sortOrder: 44, category: "self_talk", text: "Başarıyı yalnızca kaç gün uzak kaldığınla ölçme." },
  { sortOrder: 45, category: "self_talk", text: "Dürtüye rağmen doğru seçim yaptığın durumları da başarı olarak kaydet." },
  { sortOrder: 46, category: "self_talk", text: "Bir aksama sonrasında ne kadar hızlı toparlandığını takip et." },

  { sortOrder: 47, category: "support", text: "Güvendiğin bir kişiye düzenli ve kısa şekilde durumunu bildir." },
  { sortOrder: 48, category: "support", text: "Seni utandıran veya aşağılayan kişilerden destek alma." },
  { sortOrder: 49, category: "support", text: "Dua ve ibadeti kendini cezalandırmak için değil, yeniden yönelmek için kullan." },
  { sortOrder: 50, category: "support", text: "“Bu davranış değerlerimle uyuşmuyor” diyebilirsin; fakat kendini değersiz görme." },
  { sortOrder: 51, category: "support", text: "Düşüncelerin hiç gelmemesini değil, geldiğinde onları beslememeyi hedefle." },
  { sortOrder: 52, category: "support", text: "Kaygı, yalnızlık, dikkat veya uyku sorunlarını da ciddiye al." },
  { sortOrder: 53, category: "support", text: "Uzun süredir devam ettiği için uzman desteği almayı erteleme." },
  { sortOrder: 54, category: "support", text: "Her günkü hedefin dürtüyü tamamen yok etmek değil, dürtü varken doğru davranışı seçmek olsun." },
  { sortOrder: 55, category: "support", text: "Ayda bir kez filtrelerin, engellerin ve güvenli arama ayarlarının hâlâ çalıştığını kontrol et." },
];
