-- Allow Global Admins (Curador Mestre, Coordenador Científico) to UPDATE projects (locais)
CREATE POLICY "Global Admins can update all projects" 
ON "public"."locais"
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('Curador Mestre', 'Coordenador Científico')
  )
);

-- Allow Project Managers (Gestor de Acervo) to UPDATE their own assigned projects
CREATE POLICY "Managers can update their own projects" 
ON "public"."locais"
FOR UPDATE 
USING (
  gestor_id = auth.uid() 
  OR 
  id IN (SELECT local_id FROM profiles WHERE id = auth.uid())
);
