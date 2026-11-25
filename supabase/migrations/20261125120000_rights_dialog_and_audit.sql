BEGIN;

INSERT INTO public.module (module_code, module_name, sort_order)
VALUES
    ('customer', 'Customers', 1),
    ('product', 'Products', 2),
    ('humanResources', 'Human Resources', 3),
    ('sales', 'Sales', 4),
    ('reports', 'Reports', 5)
ON CONFLICT (module_code) DO UPDATE
SET module_name = EXCLUDED.module_name,
    sort_order = EXCLUDED.sort_order;

ALTER TABLE public.rights
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

INSERT INTO public.rights (right_code, module_code, description)
VALUES
    ('customer.add', 'customer', 'Add Customer'),
    ('customer.edit', 'customer', 'Edit Customer'),
    ('customer.delete', 'customer', 'Delete Customer'),
    ('product.add', 'product', 'Add Product'),
    ('product.edit', 'product', 'Edit Product'),
    ('product.delete', 'product', 'Delete Product'),
    ('product.price.add', 'product', 'Add Price'),
    ('product.price.edit', 'product', 'Edit Price'),
    ('product.price.delete', 'product', 'Delete Price'),
    ('humanResources.job.add', 'humanResources', 'Add Job'),
    ('humanResources.job.edit', 'humanResources', 'Edit Job'),
    ('humanResources.job.delete', 'humanResources', 'Delete Job'),
    ('humanResources.department.add', 'humanResources', 'Add Department'),
    ('humanResources.department.edit', 'humanResources', 'Edit Department'),
    ('humanResources.department.delete', 'humanResources', 'Delete Department'),
    ('humanResources.employee.add', 'humanResources', 'Add Employee'),
    ('humanResources.employee.edit', 'humanResources', 'Edit Employee'),
    ('humanResources.employee.delete', 'humanResources', 'Delete Employee'),
    ('humanResources.jobHistory.view', 'humanResources', 'View Job History'),
    ('humanResources.jobHistory.add', 'humanResources', 'Add Job History'),
    ('humanResources.jobHistory.edit', 'humanResources', 'Edit Job History'),
    ('humanResources.jobHistory.delete', 'humanResources', 'Delete Job History'),
    ('sales.sale.add', 'sales', 'Add Sale'),
    ('sales.sale.edit', 'sales', 'Edit Sale'),
    ('sales.sale.delete', 'sales', 'Delete Sale'),
    ('sales.saleDetail.view', 'sales', 'View Sale Detail'),
    ('sales.saleDetail.add', 'sales', 'Add Sale Detail'),
    ('sales.saleDetail.edit', 'sales', 'Edit Sale Detail'),
    ('sales.saleDetail.delete', 'sales', 'Delete Sale Detail'),
    ('reports.topCustomers', 'reports', 'Top Customers'),
    ('reports.productMasterList', 'reports', 'Product Master List'),
    ('reports.topProducts', 'reports', 'Top Products'),
    ('reports.activeEmployees', 'reports', 'Active Employees'),
    ('reports.allEmployees', 'reports', 'All Employees'),
    ('reports.employeeJobHistory', 'reports', 'Employee Job History'),
    ('reports.topSales', 'reports', 'Top Sales')
ON CONFLICT (right_code) DO UPDATE
SET module_code = EXCLUDED.module_code,
    description = EXCLUDED.description;

UPDATE public.rights AS catalog
SET sort_order = ordering.sort_order
FROM (
    VALUES
        ('customer.add', 1), ('customer.edit', 2), ('customer.delete', 3),
        ('product.add', 1), ('product.edit', 2), ('product.delete', 3),
        ('product.price.add', 4), ('product.price.edit', 5), ('product.price.delete', 6),
        ('humanResources.job.add', 1), ('humanResources.job.edit', 2),
        ('humanResources.job.delete', 3), ('humanResources.department.add', 4),
        ('humanResources.department.edit', 5), ('humanResources.department.delete', 6),
        ('humanResources.employee.add', 7), ('humanResources.employee.edit', 8),
        ('humanResources.employee.delete', 9), ('humanResources.jobHistory.view', 10),
        ('humanResources.jobHistory.add', 11), ('humanResources.jobHistory.edit', 12),
        ('humanResources.jobHistory.delete', 13),
        ('sales.sale.add', 1), ('sales.sale.edit', 2), ('sales.sale.delete', 3),
        ('sales.saleDetail.view', 4), ('sales.saleDetail.add', 5),
        ('sales.saleDetail.edit', 6), ('sales.saleDetail.delete', 7),
        ('reports.topCustomers', 1), ('reports.productMasterList', 2),
        ('reports.topProducts', 3), ('reports.activeEmployees', 4),
        ('reports.allEmployees', 5), ('reports.employeeJobHistory', 6),
        ('reports.topSales', 7)
) AS ordering(right_code, sort_order)
WHERE catalog.right_code = ordering.right_code;

UPDATE public.user_permission existing_permission
SET is_deleted = existing_permission.is_deleted AND old_permission.is_deleted
FROM public.user_permission old_permission
   , (
    VALUES
        ('customers.add', 'customer.add'),
        ('customers.edit', 'customer.edit'),
        ('customers.delete', 'customer.delete'),
        ('products.add', 'product.add'),
        ('products.edit', 'product.edit'),
        ('products.delete', 'product.delete'),
        ('products.priceAdd', 'product.price.add'),
        ('products.priceEdit', 'product.price.edit'),
        ('products.priceDelete', 'product.price.delete'),
        ('hr.jobAdd', 'humanResources.job.add'),
        ('hr.jobEdit', 'humanResources.job.edit'),
        ('hr.jobDelete', 'humanResources.job.delete'),
        ('hr.deptAdd', 'humanResources.department.add'),
        ('hr.deptEdit', 'humanResources.department.edit'),
        ('hr.deptDelete', 'humanResources.department.delete'),
        ('hr.empAdd', 'humanResources.employee.add'),
        ('hr.empEdit', 'humanResources.employee.edit'),
        ('hr.empDelete', 'humanResources.employee.delete'),
        ('hr.jhView', 'humanResources.jobHistory.view'),
        ('hr.jhAdd', 'humanResources.jobHistory.add'),
        ('hr.jhEdit', 'humanResources.jobHistory.edit'),
        ('hr.jhDelete', 'humanResources.jobHistory.delete'),
        ('sales.add', 'sales.sale.add'),
        ('sales.edit', 'sales.sale.edit'),
        ('sales.delete', 'sales.sale.delete'),
        ('sales.detailView', 'sales.saleDetail.view'),
        ('sales.detailAdd', 'sales.saleDetail.add'),
        ('sales.detailEdit', 'sales.saleDetail.edit'),
        ('sales.detailDelete', 'sales.saleDetail.delete'),
        ('reports.productMaster', 'reports.productMasterList'),
        ('reports.empJobHistory', 'reports.employeeJobHistory')
) AS key_map(old_code, new_code)
WHERE old_permission.right_code = key_map.old_code
  AND existing_permission.user_id = old_permission.user_id
  AND existing_permission.right_code = key_map.new_code;

DELETE FROM public.user_permission old_permission
USING (
    VALUES
        ('customers.add', 'customer.add'),
        ('customers.edit', 'customer.edit'),
        ('customers.delete', 'customer.delete'),
        ('products.add', 'product.add'),
        ('products.edit', 'product.edit'),
        ('products.delete', 'product.delete'),
        ('products.priceAdd', 'product.price.add'),
        ('products.priceEdit', 'product.price.edit'),
        ('products.priceDelete', 'product.price.delete'),
        ('hr.jobAdd', 'humanResources.job.add'),
        ('hr.jobEdit', 'humanResources.job.edit'),
        ('hr.jobDelete', 'humanResources.job.delete'),
        ('hr.deptAdd', 'humanResources.department.add'),
        ('hr.deptEdit', 'humanResources.department.edit'),
        ('hr.deptDelete', 'humanResources.department.delete'),
        ('hr.empAdd', 'humanResources.employee.add'),
        ('hr.empEdit', 'humanResources.employee.edit'),
        ('hr.empDelete', 'humanResources.employee.delete'),
        ('hr.jhView', 'humanResources.jobHistory.view'),
        ('hr.jhAdd', 'humanResources.jobHistory.add'),
        ('hr.jhEdit', 'humanResources.jobHistory.edit'),
        ('hr.jhDelete', 'humanResources.jobHistory.delete'),
        ('sales.add', 'sales.sale.add'),
        ('sales.edit', 'sales.sale.edit'),
        ('sales.delete', 'sales.sale.delete'),
        ('sales.detailView', 'sales.saleDetail.view'),
        ('sales.detailAdd', 'sales.saleDetail.add'),
        ('sales.detailEdit', 'sales.saleDetail.edit'),
        ('sales.detailDelete', 'sales.saleDetail.delete'),
        ('reports.productMaster', 'reports.productMasterList'),
        ('reports.empJobHistory', 'reports.employeeJobHistory')
) AS key_map(old_code, new_code)
WHERE old_permission.right_code = key_map.old_code
  AND EXISTS (
      SELECT 1
      FROM public.user_permission existing_permission
      WHERE existing_permission.user_id = old_permission.user_id
        AND existing_permission.right_code = key_map.new_code
  );

UPDATE public.user_permission permission
SET right_code = key_map.new_code
FROM (
    VALUES
        ('customers.add', 'customer.add'),
        ('customers.edit', 'customer.edit'),
        ('customers.delete', 'customer.delete'),
        ('products.add', 'product.add'),
        ('products.edit', 'product.edit'),
        ('products.delete', 'product.delete'),
        ('products.priceAdd', 'product.price.add'),
        ('products.priceEdit', 'product.price.edit'),
        ('products.priceDelete', 'product.price.delete'),
        ('hr.jobAdd', 'humanResources.job.add'),
        ('hr.jobEdit', 'humanResources.job.edit'),
        ('hr.jobDelete', 'humanResources.job.delete'),
        ('hr.deptAdd', 'humanResources.department.add'),
        ('hr.deptEdit', 'humanResources.department.edit'),
        ('hr.deptDelete', 'humanResources.department.delete'),
        ('hr.empAdd', 'humanResources.employee.add'),
        ('hr.empEdit', 'humanResources.employee.edit'),
        ('hr.empDelete', 'humanResources.employee.delete'),
        ('hr.jhView', 'humanResources.jobHistory.view'),
        ('hr.jhAdd', 'humanResources.jobHistory.add'),
        ('hr.jhEdit', 'humanResources.jobHistory.edit'),
        ('hr.jhDelete', 'humanResources.jobHistory.delete'),
        ('sales.add', 'sales.sale.add'),
        ('sales.edit', 'sales.sale.edit'),
        ('sales.delete', 'sales.sale.delete'),
        ('sales.detailView', 'sales.saleDetail.view'),
        ('sales.detailAdd', 'sales.saleDetail.add'),
        ('sales.detailEdit', 'sales.saleDetail.edit'),
        ('sales.detailDelete', 'sales.saleDetail.delete'),
        ('reports.productMaster', 'reports.productMasterList'),
        ('reports.empJobHistory', 'reports.employeeJobHistory')
) AS key_map(old_code, new_code)
WHERE permission.right_code = key_map.old_code;

DELETE FROM public.rights
WHERE right_code IN (
    'customers.add', 'customers.edit', 'customers.delete',
    'products.add', 'products.edit', 'products.delete',
    'products.priceAdd', 'products.priceEdit', 'products.priceDelete',
    'hr.jobAdd', 'hr.jobEdit', 'hr.jobDelete',
    'hr.deptAdd', 'hr.deptEdit', 'hr.deptDelete',
    'hr.empAdd', 'hr.empEdit', 'hr.empDelete',
    'hr.jhView', 'hr.jhAdd', 'hr.jhEdit', 'hr.jhDelete',
    'sales.add', 'sales.edit', 'sales.delete',
    'sales.detailView', 'sales.detailAdd', 'sales.detailEdit', 'sales.detailDelete',
    'reports.productMaster', 'reports.empJobHistory'
);

DELETE FROM public.module
WHERE module_code IN ('customers', 'products', 'hr');

CREATE TABLE IF NOT EXISTS public.user_module_permission (
    module_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL
        REFERENCES public.app_user(user_id) ON DELETE CASCADE,
    module_code VARCHAR(30) NOT NULL
        REFERENCES public.module(module_code),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    stamp VARCHAR(80),
    CONSTRAINT user_module_permission_user_module_unique
        UNIQUE (user_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_user_module_permission_user
    ON public.user_module_permission(user_id);

ALTER TABLE public.user_module_permission ENABLE ROW LEVEL SECURITY;

INSERT INTO public.user_module_permission (user_id, module_code, is_deleted)
SELECT DISTINCT permission.user_id, catalog.module_code, FALSE
FROM public.user_permission AS permission
JOIN public.rights AS catalog
  ON catalog.right_code = permission.right_code
WHERE NOT permission.is_deleted
ON CONFLICT (user_id, module_code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.replace_user_rights(
    p_user_id UUID,
    p_right_codes TEXT[],
    p_module_codes TEXT[],
    p_actor_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_role TEXT;
    v_old_rights JSONB;
    v_old_modules JSONB;
    v_new_rights JSONB;
    v_new_modules JSONB;
BEGIN
    IF p_right_codes IS NULL
       OR p_module_codes IS NULL
       OR p_actor_user_id IS NULL
       OR array_position(p_right_codes, NULL) IS NOT NULL
       OR array_position(p_module_codes, NULL) IS NOT NULL
       OR cardinality(p_right_codes) <> (
           SELECT count(DISTINCT requested.right_code)
           FROM unnest(p_right_codes) AS requested(right_code)
       )
       OR cardinality(p_module_codes) <> (
           SELECT count(DISTINCT requested.module_code)
           FROM unnest(p_module_codes) AS requested(module_code)
       ) THEN
        RAISE EXCEPTION 'Invalid rights request.' USING ERRCODE = '22023';
    END IF;

    SELECT role_code
    INTO v_target_role
    FROM public.app_user
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rights target not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_target_role <> 'user' THEN
        RAISE EXCEPTION 'Rights may only be changed for User accounts.'
            USING ERRCODE = '42501';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(p_module_codes) AS requested(module_code)
        LEFT JOIN public.module catalog
          ON catalog.module_code = requested.module_code
        WHERE catalog.module_code IS NULL
    ) OR EXISTS (
        SELECT 1
        FROM unnest(p_right_codes) AS requested(right_code)
        LEFT JOIN public.rights catalog
          ON catalog.right_code = requested.right_code
        WHERE catalog.right_code IS NULL
    ) OR EXISTS (
        SELECT 1
        FROM unnest(p_right_codes) AS requested(right_code)
        JOIN public.rights catalog
          ON catalog.right_code = requested.right_code
        WHERE NOT (catalog.module_code = ANY(p_module_codes))
    ) THEN
        RAISE EXCEPTION 'Unknown right or module assignment.' USING ERRCODE = '22023';
    END IF;

    SELECT COALESCE(jsonb_agg(permission.right_code ORDER BY permission.right_code), '[]'::JSONB)
    INTO v_old_rights
    FROM public.user_permission permission
    WHERE permission.user_id = p_user_id
      AND NOT permission.is_deleted;

    SELECT COALESCE(jsonb_agg(permission.module_code ORDER BY permission.module_code), '[]'::JSONB)
    INTO v_old_modules
    FROM public.user_module_permission permission
    WHERE permission.user_id = p_user_id
      AND NOT permission.is_deleted;

    SELECT COALESCE(jsonb_agg(requested.right_code ORDER BY requested.right_code), '[]'::JSONB)
    INTO v_new_rights
    FROM unnest(p_right_codes) AS requested(right_code);

    SELECT COALESCE(jsonb_agg(requested.module_code ORDER BY requested.module_code), '[]'::JSONB)
    INTO v_new_modules
    FROM unnest(p_module_codes) AS requested(module_code);

    IF v_old_rights = v_new_rights AND v_old_modules = v_new_modules THEN
        RETURN;
    END IF;

    PERFORM set_config('app.username', p_actor_user_id::TEXT, TRUE);

    UPDATE public.user_permission
    SET is_deleted = TRUE,
        stamp = public.audit_stamp('EDIT')
    WHERE user_id = p_user_id
      AND NOT is_deleted
      AND NOT (right_code = ANY(p_right_codes));

    INSERT INTO public.user_permission (user_id, right_code, is_deleted, stamp)
    SELECT p_user_id, requested.right_code, FALSE, public.audit_stamp('EDIT')
    FROM unnest(p_right_codes) AS requested(right_code)
    ON CONFLICT (user_id, right_code) DO UPDATE
    SET is_deleted = FALSE,
        stamp = EXCLUDED.stamp
    WHERE public.user_permission.is_deleted;

    UPDATE public.user_module_permission
    SET is_deleted = TRUE,
        stamp = public.audit_stamp('EDIT')
    WHERE user_id = p_user_id
      AND NOT is_deleted
      AND NOT (module_code = ANY(p_module_codes));

    INSERT INTO public.user_module_permission (user_id, module_code, is_deleted, stamp)
    SELECT p_user_id, requested.module_code, FALSE, public.audit_stamp('EDIT')
    FROM unnest(p_module_codes) AS requested(module_code)
    ON CONFLICT (user_id, module_code) DO UPDATE
    SET is_deleted = FALSE,
        stamp = EXCLUDED.stamp
    WHERE public.user_module_permission.is_deleted;

    UPDATE public.app_user
    SET stamp = public.audit_stamp('EDIT')
    WHERE user_id = p_user_id;

    INSERT INTO public.audit_log (
        table_name, action, record_key, old_values, new_values, action_by
    )
    VALUES (
        'user_permission',
        'EDIT',
        p_user_id::TEXT,
        jsonb_build_object('modules', v_old_modules, 'rights', v_old_rights),
        jsonb_build_object('modules', v_new_modules, 'rights', v_new_rights),
        p_actor_user_id::TEXT
    );
END;
$$;

REVOKE ALL ON FUNCTION public.replace_user_rights(UUID, TEXT[], TEXT[], UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_user_rights(UUID, TEXT[], TEXT[], UUID)
    TO service_role;

COMMIT;
