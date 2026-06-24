/**
 * gen-legal-pages.mjs — Pages légales obligatoires (AdSense): about, contact, privacy, terms.
 * Contenu original substantiel en arabe + résumé multilingue.
 */
import fs from 'fs';

const BASE = 'https://matbakh360.com';
const today = new Date().toISOString().split('T')[0];

const shell = (title, desc, slug, bodyHtml) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-NTM6B493');</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6870790039775701" crossorigin="anonymous"></script>
<meta name="google-adsense-account" content="ca-pub-6870790039775701">
<title>${title} | مطبخ 360</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<link rel="canonical" href="${BASE}/${slug}.html">
<style>body{font-family:'Tajawal',-apple-system,system-ui,sans-serif;max-width:760px;margin:0 auto;padding:24px;line-height:1.9;color:#1a1a1a}h1{color:#C2410C;font-size:30px}h2{color:#C2410C;font-size:20px;margin-top:28px;border-bottom:2px solid #f0d9cc;padding-bottom:6px}a{color:#C2410C}nav.crumb{font-size:13px;color:#888;margin-bottom:14px}footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;text-align:center;font-size:13px;color:#888}</style>
</head>
<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NTM6B493" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<nav class="crumb"><a href="${BASE}">🏠 الرئيسية</a> › ${title}</nav>
${bodyHtml}
<footer>
  <a href="${BASE}/about.html">من نحن</a> · <a href="${BASE}/contact.html">اتصل بنا</a> ·
  <a href="${BASE}/privacy.html">الخصوصية</a> · <a href="${BASE}/terms.html">الشروط</a><br>
  © ${new Date().getFullYear()} مطبخ 360 — جميع الحقوق محفوظة
</footer>
</body></html>`;

const pages = {
  about: shell('من نحن', 'تعرّف على مطبخ 360، موسوعة الطبخ العالمية متعددة اللغات.', 'about', `
<h1>من نحن</h1>
<p><strong>مطبخ 360</strong> هو موقع ومنصة متخصصة في الطبخ العالمي، نجمع آلاف الوصفات الأصيلة من أكثر من 60 مطبخاً حول العالم — من الكسكس المغربي إلى الراميان الياباني، ومن التاكو المكسيكي إلى الباييلا الإسبانية.</p>
<h2>رسالتنا</h2>
<p>نؤمن أن الطعام لغة عالمية تجمع الثقافات. هدفنا أن نُتيح لكل محب للطبخ الوصول إلى وصفات موثوقة، مشروحة خطوة بخطوة، مع المكونات الدقيقة والقيم الغذائية وأوقات التحضير، وبثماني لغات (العربية، الفرنسية، الإنجليزية، الإسبانية، البرتغالية، الإيطالية، الصينية، اليابانية).</p>
<h2>ماذا نقدّم</h2>
<ul>
<li><strong>وصفات مفصّلة:</strong> مكونات، خطوات، نصائح الشيف، وقيمة غذائية لكل حصة.</li>
<li><strong>دليل المطاعم:</strong> أفضل المطاعم في المدن الكبرى مع التقييمات والعناوين.</li>
<li><strong>فيديوهات الطبخ:</strong> مقاطع مختارة من أمهر الطهاة والمؤثرين.</li>
<li><strong>تجربة متعددة اللغات:</strong> محتوى مترجم لخدمة جمهور عالمي.</li>
</ul>
<h2>فريقنا</h2>
<p>مطبخ 360 مشروع مستقل يديره فريق صغير شغوف بالطبخ والتكنولوجيا، يعمل على إثراء المحتوى وتحسين التجربة باستمرار. نرحّب بملاحظاتكم واقتراحاتكم عبر <a href="${BASE}/contact.html">صفحة الاتصال</a>.</p>
`),

  contact: shell('اتصل بنا', 'تواصل مع فريق مطبخ 360 لأي استفسار أو اقتراح.', 'contact', `
<h1>اتصل بنا</h1>
<p>يسعدنا تواصلكم معنا لأي سؤال أو اقتراح أو ملاحظة حول المحتوى. نقرأ كل الرسائل ونردّ في أقرب وقت ممكن.</p>
<h2>البريد الإلكتروني</h2>
<p>للاستفسارات العامة والشراكات والإعلانات:<br>
<a href="mailto:contact@matbakh360.com">contact@matbakh360.com</a></p>
<h2>اقتراح وصفة أو تصحيح</h2>
<p>إذا لاحظت خطأً في وصفة أو أردت اقتراح طبق جديد، راسلنا على نفس البريد مع ذكر رابط الصفحة المعنية وسنراجعها.</p>
<h2>أوقات الرد</h2>
<p>نسعى للرد خلال 48 ساعة في أيام العمل. شكراً لتفهمكم.</p>
`),

  privacy: shell('سياسة الخصوصية', 'سياسة الخصوصية الخاصة بموقع مطبخ 360 واستخدام البيانات والإعلانات.', 'privacy', `
<h1>سياسة الخصوصية</h1>
<p>آخر تحديث: ${today}</p>
<p>تحترم منصة <strong>مطبخ 360</strong> (matbakh360.com) خصوصية زوّارها. توضّح هذه السياسة كيف نجمع ونستخدم المعلومات.</p>
<h2>المعلومات التي نجمعها</h2>
<p>لا نطلب معلومات شخصية للتصفح. عند استخدام الموقع قد تُجمع بيانات تقنية تلقائية (نوع المتصفح، الجهاز، الصفحات المزارة) لأغراض إحصائية وتحسين الخدمة عبر <strong>Google Analytics</strong> و<strong>Google Tag Manager</strong>.</p>
<h2>ملفات تعريف الارتباط (Cookies)</h2>
<p>يستخدم الموقع ملفات تعريف الارتباط لتحسين التجربة وتذكّر تفضيلاتك (مثل اللغة والوضع الليلي). يمكنك تعطيلها من إعدادات متصفحك.</p>
<h2>الإعلانات — Google AdSense</h2>
<p>يعرض هذا الموقع إعلانات عبر <strong>Google AdSense</strong>. تستخدم Google ملفات تعريف ارتباط لعرض إعلانات مبنية على زياراتك السابقة لهذا الموقع ومواقع أخرى. يمكنك إلغاء تخصيص الإعلانات من خلال
<a href="https://www.google.com/settings/ads" rel="nofollow">إعدادات إعلانات Google</a>. كما تستخدم Google معرّف الإعلان للزوار وفق
<a href="https://policies.google.com/technologies/ads" rel="nofollow">سياسة إعلانات Google</a>.</p>
<h2>روابط الطرف الثالث</h2>
<p>قد يحتوي الموقع على روابط لمواقع خارجية (يوتيوب، خرائط Google، إلخ) لها سياسات خصوصية خاصة لا نتحمّل مسؤوليتها.</p>
<h2>حقوقك</h2>
<p>لك الحق في طلب معرفة أو حذف أي بيانات تخصّك عبر مراسلتنا على <a href="mailto:contact@matbakh360.com">contact@matbakh360.com</a>.</p>
<h2>التعديلات</h2>
<p>قد نُحدّث هذه السياسة دورياً، وسيظهر تاريخ آخر تحديث أعلى الصفحة.</p>
`),

  terms: shell('شروط الاستخدام', 'شروط وأحكام استخدام موقع مطبخ 360.', 'terms', `
<h1>شروط الاستخدام</h1>
<p>آخر تحديث: ${today}</p>
<p>باستخدامك موقع <strong>مطبخ 360</strong> فإنك توافق على الشروط التالية.</p>
<h2>استخدام المحتوى</h2>
<p>المحتوى المنشور (وصفات، صور، فيديوهات) مُقدّم لأغراض إعلامية وتعليمية. تُجمع بعض الوصفات والبيانات من مصادر عامة مثل TheMealDB وOpenStreetMap مع الإشارة إلى مصادرها. يُمنع إعادة نشر المحتوى تجارياً دون إذن.</p>
<h2>دقة المعلومات</h2>
<p>نبذل جهداً لضمان دقة الوصفات والقيم الغذائية، لكنها تقديرية وقد تختلف. يتحمّل المستخدم مسؤولية التحقق، خاصة فيما يتعلق بالحساسية الغذائية.</p>
<h2>المسؤولية</h2>
<p>لا يتحمّل مطبخ 360 أي مسؤولية عن أضرار ناتجة عن استخدام المحتوى أو الروابط الخارجية.</p>
<h2>الملكية الفكرية</h2>
<p>اسم وشعار "مطبخ 360" والتصميم العام مملوكة للموقع. حقوق الوصفات الأصلية تعود لمصادرها.</p>
<h2>التغييرات</h2>
<p>نحتفظ بحق تعديل هذه الشروط في أي وقت.</p>
`),
};

for (const [slug, html] of Object.entries(pages)) {
  fs.writeFileSync(`${slug}.html`, html, 'utf8');
}
console.log(`✅ Pages légales: ${Object.keys(pages).join(', ')}`);
