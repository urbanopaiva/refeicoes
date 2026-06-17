/**
 * Banco de dados do app "Minhas Refeições" usando Google Planilhas.
 *
 * COMO INSTALAR (passo a passo no arquivo COMO-USAR.txt):
 * 1. Crie uma planilha em https://sheets.google.com
 * 2. Menu  Extensões > Apps Script
 * 3. Apague o que estiver lá e COLE todo este código
 * 4. Clique em "Implantar" > "Nova implantação"
 *    - Tipo: App da Web
 *    - Executar como: Eu (sua conta)
 *    - Quem pode acessar: Qualquer pessoa
 * 5. Copie a URL gerada (termina em /exec) e cole no app, em Configurações.
 */

// Recebe os dados do app e salva (chamado quando você registra/edita refeições)
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var data = body.data || {};
    PropertiesService.getScriptProperties().setProperty('DATA', JSON.stringify(data));
    escreverPlanilha(data);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Devolve os dados salvos (chamado quando você usa "Restaurar da nuvem")
function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'load') {
    var p = PropertiesService.getScriptProperties().getProperty('DATA') || '{}';
    return ContentService.createTextOutput(p).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('App de refeições funcionando.');
}

// Escreve as refeições numa aba legível da planilha
function escreverPlanilha(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Refeições') || ss.insertSheet('Refeições');
  sh.clear();
  sh.appendRow(['Data', 'Refeição', 'Horário', 'Alimento', 'Quantidade', 'Calorias (kcal)', 'Proteínas (g)', 'Carboidratos (g)', 'Gorduras (g)']);

  var tipos = { cafe: 'Café da manhã', almoco: 'Almoço', lanche: 'Lanche', jantar: 'Jantar' };
  var meals = (data.meals || []).slice().sort(function (a, b) {
    return (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
  });

  var linhas = meals.map(function (m) {
    return [m.date, tipos[m.type] || m.type, m.time || '', m.name, m.detail || '',
      Math.round(m.kcal || 0), Math.round(m.p || 0), Math.round(m.cb || 0), Math.round(m.f || 0)];
  });
  if (linhas.length) sh.getRange(2, 1, linhas.length, 9).setValues(linhas);

  // Aba de totais por dia
  var sh2 = ss.getSheetByName('Total por dia') || ss.insertSheet('Total por dia');
  sh2.clear();
  sh2.appendRow(['Data', 'Calorias do dia', 'Meta', 'Diferença']);
  var porDia = {};
  meals.forEach(function (m) { porDia[m.date] = (porDia[m.date] || 0) + Math.round(m.kcal || 0); });
  var meta = data.goal || 2000;
  var dias = Object.keys(porDia).sort();
  var linhas2 = dias.map(function (d) { return [d, porDia[d], meta, porDia[d] - meta]; });
  if (linhas2.length) sh2.getRange(2, 1, linhas2.length, 4).setValues(linhas2);

  sh.setFrozenRows(1);
  sh2.setFrozenRows(1);
}
