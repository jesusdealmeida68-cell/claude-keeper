-- Remove as tarefas de exemplo (dados falsos) inseridas automaticamente por uma
-- migração anterior. Só apaga se ninguém ainda submeteu essas tarefas, para não
-- perder histórico real de nenhum utilizador.
DELETE FROM public.tasks t
WHERE t.title IN (
    'Avaliação de aplicativo',
    'Seguir página nas redes sociais',
    'Testar novo serviço'
  )
  AND t.description IN (
    'Avalie o aplicativo seguindo as instruções abaixo.',
    'Siga a página indicada e envie a evidência.',
    'Experimente o serviço parceiro e partilha a tua opinião.'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.task_submissions ts WHERE ts.task_id = t.id
  );
