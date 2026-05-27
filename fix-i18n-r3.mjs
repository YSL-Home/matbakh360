/**
 * fix-i18n-r3.mjs — Round 3 : correction de tous les textes arabes restants
 */
import fs from 'fs';
const FILE = new URL('./index.html', import.meta.url).pathname;
let html = fs.readFileSync(FILE, 'utf8');

// ─── 1. NOUVELLES CLÉS I18N ────────────────────────────────────────────────────
const NEW_KEYS = {
  ar: {
    remaining:'متبقٍ', cm_done:'اكتمل!', cm_step:'الخطوة',
    cm_of:'من', cm_start:'▶ ابدأ', cm_pause:'⏸ إيقاف', cm_timer_done:'انتهى!',
    nav_logout:'← تسجيل الخروج', nav_my_favs:'❤️ وصفاتي المحفوظة',
    fav_removed:'تمت الإزالة من المحفوظات', fav_saved_toast:'تم الحفظ! ❤️',
    copy_done:'✓ تم النسخ', copy_link_done:'✓ تم نسخ الرابط',
    auth_welcome_new:'مرحباً {name}! 🎉',
    auth_welcome_back:'أهلاً بعودتك {name}! 👋',
    auth_logout_done:'تم تسجيل الخروج 👋',
    auth_redirecting:'جارٍ التوجيه… 🔄',
    auth_login_error:'خطأ في تسجيل الدخول: ',
    err_name_req:'الاسم مطلوب',
    err_email_invalid:'بريد إلكتروني غير صحيح',
    err_pw_short:'كلمة المرور 6 أحرف على الأقل',
    err_email_exists:'هذا البريد مسجّل بالفعل',
    err_email_req:'أدخل بريدك الإلكتروني',
    err_no_account:'لا يوجد حساب بهذا البريد',
    err_pw_wrong:'كلمة المرور غير صحيحة',
    sloc_directions:'🗺️ الاتجاهات', sloc_see_more:'عرض المزيد →',
    sloc_no_restos:'لا توجد مطاعم', sloc_no_restos_price:'لا توجد مطاعم بهذا السعر',
    sloc_adjust_filters:'جرّب تعديل الفلاتر', sloc_searching:'جارٍ البحث…',
    sloc_no_results:'لا توجد نتائج',
  },
  fr: {
    remaining:'restant(s)', cm_done:'Terminé!', cm_step:'Étape',
    cm_of:'sur', cm_start:'▶ Démarrer', cm_pause:'⏸ Pause', cm_timer_done:'Terminé!',
    nav_logout:'← Déconnexion', nav_my_favs:'❤️ Mes recettes sauvegardées',
    fav_removed:'Retiré des favoris', fav_saved_toast:'Sauvegardé! ❤️',
    copy_done:'✓ Copié', copy_link_done:'✓ Lien copié',
    auth_welcome_new:'Bienvenue {name}! 🎉',
    auth_welcome_back:'Bon retour {name}! 👋',
    auth_logout_done:'Déconnecté 👋',
    auth_redirecting:'Redirection… 🔄',
    auth_login_error:'Erreur de connexion: ',
    err_name_req:'Nom requis',
    err_email_invalid:'Email invalide',
    err_pw_short:'Mot de passe: 6 caractères minimum',
    err_email_exists:'Cet email est déjà utilisé',
    err_email_req:'Entrez votre email',
    err_no_account:'Aucun compte avec cet email',
    err_pw_wrong:'Mot de passe incorrect',
    sloc_directions:'🗺️ Itinéraire', sloc_see_more:'Voir plus →',
    sloc_no_restos:'Aucun restaurant', sloc_no_restos_price:'Aucun restaurant dans cette gamme de prix',
    sloc_adjust_filters:'Essayez de modifier les filtres', sloc_searching:'Recherche…',
    sloc_no_results:'Aucun résultat',
  },
  en: {
    remaining:'remaining', cm_done:'Done!', cm_step:'Step',
    cm_of:'of', cm_start:'▶ Start', cm_pause:'⏸ Pause', cm_timer_done:'Done!',
    nav_logout:'← Logout', nav_my_favs:'❤️ My saved recipes',
    fav_removed:'Removed from favorites', fav_saved_toast:'Saved! ❤️',
    copy_done:'✓ Copied', copy_link_done:'✓ Link copied',
    auth_welcome_new:'Welcome {name}! 🎉',
    auth_welcome_back:'Welcome back {name}! 👋',
    auth_logout_done:'Logged out 👋',
    auth_redirecting:'Redirecting… 🔄',
    auth_login_error:'Login error: ',
    err_name_req:'Name required',
    err_email_invalid:'Invalid email',
    err_pw_short:'Password: at least 6 characters',
    err_email_exists:'This email is already registered',
    err_email_req:'Enter your email',
    err_no_account:'No account with this email',
    err_pw_wrong:'Incorrect password',
    sloc_directions:'🗺️ Directions', sloc_see_more:'See more →',
    sloc_no_restos:'No restaurants', sloc_no_restos_price:'No restaurants in this price range',
    sloc_adjust_filters:'Try adjusting the filters', sloc_searching:'Searching…',
    sloc_no_results:'No results',
  },
  es: {
    remaining:'restante(s)', cm_done:'¡Listo!', cm_step:'Paso',
    cm_of:'de', cm_start:'▶ Iniciar', cm_pause:'⏸ Pausa', cm_timer_done:'¡Listo!',
    nav_logout:'← Cerrar sesión', nav_my_favs:'❤️ Mis recetas guardadas',
    fav_removed:'Eliminado de favoritos', fav_saved_toast:'¡Guardado! ❤️',
    copy_done:'✓ Copiado', copy_link_done:'✓ Enlace copiado',
    auth_welcome_new:'¡Bienvenido/a {name}! 🎉',
    auth_welcome_back:'¡Bienvenido/a de vuelta {name}! 👋',
    auth_logout_done:'Sesión cerrada 👋',
    auth_redirecting:'Redirigiendo… 🔄',
    auth_login_error:'Error de inicio de sesión: ',
    err_name_req:'Nombre requerido',
    err_email_invalid:'Email inválido',
    err_pw_short:'Contraseña: mínimo 6 caracteres',
    err_email_exists:'Este email ya está registrado',
    err_email_req:'Introduce tu email',
    err_no_account:'No hay cuenta con este email',
    err_pw_wrong:'Contraseña incorrecta',
    sloc_directions:'🗺️ Cómo llegar', sloc_see_more:'Ver más →',
    sloc_no_restos:'Sin restaurantes', sloc_no_restos_price:'Sin restaurantes en este rango de precios',
    sloc_adjust_filters:'Prueba ajustando los filtros', sloc_searching:'Buscando…',
    sloc_no_results:'Sin resultados',
  },
  pt: {
    remaining:'restante(s)', cm_done:'Concluído!', cm_step:'Passo',
    cm_of:'de', cm_start:'▶ Iniciar', cm_pause:'⏸ Pausa', cm_timer_done:'Concluído!',
    nav_logout:'← Sair', nav_my_favs:'❤️ Minhas receitas salvas',
    fav_removed:'Removido dos favoritos', fav_saved_toast:'Salvo! ❤️',
    copy_done:'✓ Copiado', copy_link_done:'✓ Link copiado',
    auth_welcome_new:'Bem-vindo/a {name}! 🎉',
    auth_welcome_back:'Bem-vindo/a de volta {name}! 👋',
    auth_logout_done:'Desconectado 👋',
    auth_redirecting:'Redirecionando… 🔄',
    auth_login_error:'Erro de login: ',
    err_name_req:'Nome obrigatório',
    err_email_invalid:'Email inválido',
    err_pw_short:'Senha: mínimo 6 caracteres',
    err_email_exists:'Este email já está registado',
    err_email_req:'Insira o seu email',
    err_no_account:'Sem conta com este email',
    err_pw_wrong:'Senha incorreta',
    sloc_directions:'🗺️ Como chegar', sloc_see_more:'Ver mais →',
    sloc_no_restos:'Sem restaurantes', sloc_no_restos_price:'Sem restaurantes nesta faixa de preço',
    sloc_adjust_filters:'Tente ajustar os filtros', sloc_searching:'A pesquisar…',
    sloc_no_results:'Sem resultados',
  },
  it: {
    remaining:'rimanente/i', cm_done:'Fatto!', cm_step:'Passo',
    cm_of:'di', cm_start:'▶ Avvia', cm_pause:'⏸ Pausa', cm_timer_done:'Finito!',
    nav_logout:'← Disconnetti', nav_my_favs:'❤️ Le mie ricette salvate',
    fav_removed:'Rimosso dai preferiti', fav_saved_toast:'Salvato! ❤️',
    copy_done:'✓ Copiato', copy_link_done:'✓ Link copiato',
    auth_welcome_new:'Benvenuto/a {name}! 🎉',
    auth_welcome_back:'Bentornato/a {name}! 👋',
    auth_logout_done:'Disconnesso 👋',
    auth_redirecting:'Reindirizzamento… 🔄',
    auth_login_error:'Errore di accesso: ',
    err_name_req:'Nome obbligatorio',
    err_email_invalid:'Email non valida',
    err_pw_short:'Password: minimo 6 caratteri',
    err_email_exists:'Questa email è già registrata',
    err_email_req:'Inserisci la tua email',
    err_no_account:'Nessun account con questa email',
    err_pw_wrong:'Password errata',
    sloc_directions:'🗺️ Indicazioni', sloc_see_more:'Vedi altro →',
    sloc_no_restos:'Nessun ristorante', sloc_no_restos_price:'Nessun ristorante in questa fascia di prezzo',
    sloc_adjust_filters:'Prova a modificare i filtri', sloc_searching:'Ricerca…',
    sloc_no_results:'Nessun risultato',
  },
  zh: {
    remaining:'剩余', cm_done:'完成!', cm_step:'第',
    cm_of:'步/共', cm_start:'▶ 开始', cm_pause:'⏸ 暂停', cm_timer_done:'结束!',
    nav_logout:'← 退出', nav_my_favs:'❤️ 我保存的食谱',
    fav_removed:'已从收藏中移除', fav_saved_toast:'已保存! ❤️',
    copy_done:'✓ 已复制', copy_link_done:'✓ 链接已复制',
    auth_welcome_new:'欢迎 {name}! 🎉',
    auth_welcome_back:'欢迎回来 {name}! 👋',
    auth_logout_done:'已退出 👋',
    auth_redirecting:'跳转中… 🔄',
    auth_login_error:'登录错误: ',
    err_name_req:'姓名必填',
    err_email_invalid:'邮箱无效',
    err_pw_short:'密码至少6个字符',
    err_email_exists:'此邮箱已注册',
    err_email_req:'请输入邮箱',
    err_no_account:'该邮箱无账户',
    err_pw_wrong:'密码错误',
    sloc_directions:'🗺️ 导航', sloc_see_more:'查看更多 →',
    sloc_no_restos:'无餐厅', sloc_no_restos_price:'该价位无餐厅',
    sloc_adjust_filters:'尝试调整筛选条件', sloc_searching:'搜索中…',
    sloc_no_results:'无结果',
  },
  ja: {
    remaining:'残り', cm_done:'完了!', cm_step:'ステップ',
    cm_of:'/', cm_start:'▶ 開始', cm_pause:'⏸ 一時停止', cm_timer_done:'終了!',
    nav_logout:'← ログアウト', nav_my_favs:'❤️ 保存したレシピ',
    fav_removed:'お気に入りから削除', fav_saved_toast:'保存しました! ❤️',
    copy_done:'✓ コピー済み', copy_link_done:'✓ リンクをコピーしました',
    auth_welcome_new:'{name}さん、ようこそ! 🎉',
    auth_welcome_back:'{name}さん、おかえり! 👋',
    auth_logout_done:'ログアウトしました 👋',
    auth_redirecting:'リダイレクト中… 🔄',
    auth_login_error:'ログインエラー: ',
    err_name_req:'名前は必須です',
    err_email_invalid:'メールアドレスが無効です',
    err_pw_short:'パスワードは6文字以上',
    err_email_exists:'このメールはすでに登録されています',
    err_email_req:'メールアドレスを入力してください',
    err_no_account:'このメールのアカウントがありません',
    err_pw_wrong:'パスワードが違います',
    sloc_directions:'🗺️ 道順', sloc_see_more:'もっと見る →',
    sloc_no_restos:'レストランなし', sloc_no_restos_price:'この価格帯のレストランはありません',
    sloc_adjust_filters:'フィルターを調整してみてください', sloc_searching:'検索中…',
    sloc_no_results:'結果なし',
  }
};

// Inject into I18N
const I18N_RE = /const I18N=\{([\s\S]*?)\};\s*let _lang/;
const match = html.match(I18N_RE);
if (!match) { console.error('I18N not found'); process.exit(1); }

let i18nBlock = match[0];
for (const [lang, keys] of Object.entries(NEW_KEYS)) {
  const langRE = new RegExp(`(${lang}:\\{[^}]+)(\\})`);
  i18nBlock = i18nBlock.replace(langRE, (m, before, close) => {
    const existingKeys = [...before.matchAll(/(\w+):/g)].map(m => m[1]);
    const toAdd = Object.entries(keys)
      .filter(([k]) => !existingKeys.includes(k))
      .map(([k,v]) => `${k}:'${v.replace(/'/g, "\\'")}'`)
      .join(',');
    return toAdd ? `${before},${toAdd}${close}` : `${before}${close}`;
  });
}
html = html.replace(I18N_RE, i18nBlock);
console.log('✅ New I18N keys added');

// ─── 2. JS DYNAMIC FIXES ──────────────────────────────────────────────────────

// vidCard: 🔥 رائج tag
html = html.replace(
  '`<span class="vctag h">🔥 رائج</span>`',
  '`<span class="vctag h">${t(\'trending\')}</span>`'
);
console.log('✅ vidCard trending tag fixed');

// Load more remaining
html = html.replace(
  '`<div class="load-more-info">${slice.length} / ${recs.length} — ${rem} متبقٍ</div>`',
  '`<div class="load-more-info">${slice.length} / ${recs.length} — ${rem} ${t(\'remaining\')}</div>`'
);
console.log('✅ Load more "remaining" fixed');

// Chef mode step label
html = html.replace(
  `document.getElementById('cm-step-lbl').textContent=finished?'اكتمل!': \`الخطوة \${cur+1} من \${total}\`;`,
  `document.getElementById('cm-step-lbl').textContent=finished?t('cm_done'):\`\${t('cm_step')} \${cur+1} \${t('cm_of')} \${total}\`;`
);
console.log('✅ Chef mode step label fixed');

// Chef mode timer: ▶ ابدأ (multiple occurrences)
html = html.replace(/textContent='▶ ابدأ'/g, `textContent=t('cm_start')`);
html = html.replace(/textContent='⏸ إيقاف'/g, `textContent=t('cm_pause')`);
html = html.replace(/textContent='انتهى!'/g, `textContent=t('cm_timer_done')`);
console.log('✅ Chef mode timer labels fixed');

// toggleFav: save/unsave toasts and button labels
html = html.replace(
  `showToast('تمت الإزالة من المحفوظات');
    if(btn){btn.textContent='🤍 حفظ';btn.style.background='var(--card)';btn.style.color='var(--s)';}`,
  `showToast(t('fav_removed'));
    if(btn){btn.textContent=t('save_btn');btn.style.background='var(--card)';btn.style.color='var(--s)';}`
);
html = html.replace(
  `showToast('تم الحفظ! ❤️');
    if(btn){btn.textContent='❤️ محفوظ';btn.style.background='var(--r)';btn.style.color='#fff';}`,
  `showToast(t('fav_saved_toast'));
    if(btn){btn.textContent=t('saved_btn');btn.style.background='var(--r)';btn.style.color='#fff';}`
);
console.log('✅ toggleFav toast + button labels fixed');

// cardShare copy toast
html = html.replace(
  `t.textContent='✓ تم نسخ الرابط';`,
  `t.textContent=t('copy_link_done');`
);
// shareRecipe copy toasts
html = html.replace(
  `navigator.clipboard.writeText(full).then(()=>showToast('تم نسخ الوصفة! 🔗'));`,
  `navigator.clipboard.writeText(full).then(()=>showToast(t('copy_done')));`
);
html = html.replace(
  `showToast('تم النسخ! 🔗');`,
  `showToast(t('copy_done'));`
);
console.log('✅ Share copy toasts fixed');

// Auth toasts + errors
html = html.replace(
  `showToast(\`مرحباً \${name}! 🎉 تم إنشاء حسابك\`);`,
  `showToast(t('auth_welcome_new').replace('{name}',name));`
);
html = html.replace(
  `showToast(\`أهلاً بعودتك \${user.name}! 👋\`);`,
  `showToast(t('auth_welcome_back').replace('{name}',user.name));`
);
html = html.replace(
  `showToast('تم تسجيل الخروج 👋');`,
  `showToast(t('auth_logout_done'));`
);
// doRegister errors
html = html.replace(`err.textContent='الاسم مطلوب';`, `err.textContent=t('err_name_req');`);
html = html.replace(`err.textContent='بريد إلكتروني غير صحيح';`, `err.textContent=t('err_email_invalid');`);
html = html.replace(`err.textContent='كلمة المرور 6 أحرف على الأقل';`, `err.textContent=t('err_pw_short');`);
html = html.replace(`err.textContent='هذا البريد مسجّل بالفعل';`, `err.textContent=t('err_email_exists');`);
// doLogin errors
html = html.replace(`err.textContent='أدخل بريدك الإلكتروني';`, `err.textContent=t('err_email_req');`);
html = html.replace(`err.textContent='لا يوجد حساب بهذا البريد';`, `err.textContent=t('err_no_account');`);
html = html.replace(`err.textContent='كلمة المرور غير صحيحة';`, `err.textContent=t('err_pw_wrong');`);
console.log('✅ Auth errors + toasts fixed');

// OAuth toasts
html = html.replace(
  `showToast('جارٍ التوجيه إلى Google… 🔄');`,
  `showToast(t('auth_redirecting'));`
);
html = html.replace(
  `showToast('جارٍ التوجيه إلى Facebook… 🔄');`,
  `showToast(t('auth_redirecting'));`
);
html = html.replace(/showToast\('خطأ في تسجيل الدخول: '\+error\.message\)/g,
  `showToast(t('auth_login_error')+error.message)`
);
console.log('✅ OAuth toasts fixed');

// showUserMenu popup
html = html.replace(
  `>❤️ وصفاتي المحفوظة</button>`,
  `>\${t('nav_my_favs')}</button>`
);
html = html.replace(
  `>← تسجيل الخروج</button>`,
  `>\${t('nav_logout')}</button>`
);
console.log('✅ User menu popup fixed');

// Sloc popup directions + see more
html = html.replace(
  `<a href="${'${navUrl}'}" target="_blank" class="sloc-pop-btn nav">🗺️ الاتجاهات</a>`,
  `<a href="\${navUrl}" target="_blank" class="sloc-pop-btn nav">\${t('sloc_directions')}</a>`
);
html = html.replace(
  `<button class="sloc-pop-btn dtl" onclick="slocOpenDetail('\${r.id}')">عرض المزيد →</button>`,
  `<button class="sloc-pop-btn dtl" onclick="slocOpenDetail('\${r.id}')">\${t('sloc_see_more')}</button>`
);
console.log('✅ Sloc popup buttons fixed');

// slocRenderList: empty state
html = html.replace(
  `<div class="sloc-empty-txt">لا توجد مطاعم\${fp?' بهذا السعر':''}</div>
      <div class="sloc-empty-sub">جرب تعديل الفلاتر</div>`,
  `<div class="sloc-empty-txt">\${fp?t('sloc_no_restos_price'):t('sloc_no_restos')}</div>
      <div class="sloc-empty-sub">\${t('sloc_adjust_filters')}</div>`
);
console.log('✅ slocRenderList empty state fixed');

// slocShowSuggestions: searching + no results
html = html.replace(
  `suggest.innerHTML=html||'<div class="sloc-loading"><div class="sloc-spin"></div> جارٍ البحث…</div>';`,
  `suggest.innerHTML=html||(\`<div class="sloc-loading"><div class="sloc-spin"></div> \${t('sloc_searching')}</div>\`);`
);
html = html.replace(
  `suggest.innerHTML='<div class="sloc-sug-item" style="cursor:default;color:var(--t3)">لا توجد نتائج</div>';`,
  `suggest.innerHTML=\`<div class="sloc-sug-item" style="cursor:default;color:var(--t3)">\${t('sloc_no_results')}</div>\`;`
);
console.log('✅ slocShowSuggestions searching/no-results fixed');

// ─── 3. WRITE ─────────────────────────────────────────────────────────────────
fs.writeFileSync(FILE, html, 'utf8');
console.log('\n🎉 Round 3 terminé — tous les textes arabes dynamiques corrigés');
