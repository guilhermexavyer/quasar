-- Quasar: Administração do Sistema > Usuários ganha o checkbox "Ver auditoria"
-- (usuario.ie_ver_auditoria: 'S' marcado / 'N' desmarcado). Desmarcado, o usuário não vê
-- os infobuttons dos logs de criação/alteração do rodapé dos formulários (que abrem o
-- histórico de auditoria); os logs em si continuam aparecendo.
--
-- Os usuários já cadastrados continuam vendo a auditoria, como antes ('S').

alter table usuario add column ie_ver_auditoria text check (ie_ver_auditoria in ('S', 'N'));
update usuario set ie_ver_auditoria = 'S' where ie_ver_auditoria is null;
