# AGENTS.md

Huong dan cho AI agents lam viec voi backend NestJS trong repo nay.

## Tong quan du an

- Backend dung NestJS 11, TypeScript, TypeORM 0.3 va MySQL.
- Ma nguon chinh nam trong `src/`; output build nam trong `dist/`.
- Cau hinh database nam o `src/data-source.ts` va doc bien moi truong tu `.env`.
- Entity dang duoc chia theo domain trong `src/entities/*`.
- Repo co alias import trong `tsconfig.json`, uu tien dung `@/...` khi import tu `src`.

## Lenh thuong dung

- Cai dependencies: `npm install`
- Chay dev: `npm run start:dev`
- Build: `npm run build`
- Lint va auto-fix: `npm run lint`
- Format: `npm run format`
- Chay production build: `npm run start:prod`
- Tao migration trong `src/migrations`: `npm run migration:create --name=<ten_migration>`
- Generate migration tu entity: `npm run migration:generate --name=<ten_migration>`
- Chay migration: `npm run migration:run`
- Revert migration gan nhat: `npm run migration:revert`
- Chay seed: `npm run seed:run`

## Bien moi truong

Ung dung can cac bien sau trong `.env`:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `TYPEORM_SYNC`

Khong commit `.env` hoac secret that. Neu can them bien moi truong, cap nhat tai lieu lien quan va dam bao app co gia tri fallback hop ly neu phu hop.

## Quy uoc code

- Dung TypeScript va decorator theo style NestJS hien co.
- Uu tien single quote va trailing comma theo `.prettierrc`.
- Khong sua truc tiep file trong `dist/`; chi sua source trong `src/`.
- Khong them abstraction lon neu thay doi chi can xu ly cuc bo.
- Khi them module moi, giu cau truc quen thuoc cua NestJS: module, service, repository/controller neu can.
- Khi import noi bo tu `src`, uu tien alias `@/...`; import gan trong cung thu muc co the dung relative path neu ngan gon hon.
- Lint hien dang bat `@typescript-eslint/no-floating-promises` va `@typescript-eslint/no-unsafe-argument` o muc warning; van nen xu ly promise ro rang.
- Tra ve type ro rang cho public methods khi code co logic business hoac database.

## TypeORM va database

- Entity ke thua `src/entities/base.entity.ts` khi can cac cot `id`, `createdAt`, `updatedAt`, `deletedAt`.
- Khi them entity moi, import entity do vao `entities` trong `src/data-source.ts`.
- Database dang dung MySQL voi charset `utf8mb4`.
- Chi dung `synchronize` cho moi truong phat trien khi `TYPEORM_SYNC=true`; voi thay doi schema nen tao migration.
- Migration CLI dung `cliDataSourceOptions` trong `src/data-source.ts`.
- Khi tao bang/entity moi, khong khai bao quan he TypeORM nhu `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`, `@JoinColumn`.
- Neu can tham chieu den bang khac, chi them cot tham chieu dang scalar, vi du `userId`, `locationId`, `categoryId`, voi kieu du lieu phu hop.
- Viec join du lieu giua cac bang nen xu ly ro trong repository/service/query builder khi can, khong dua vao relation decorator trong entity.

## Kiem thu va xac minh

Truoc khi ket thuc thay doi backend, chay it nhat:

1. `npm run build`
2. `npm run lint`

Neu thay doi lien quan database, kiem tra migration hoac it nhat verify `src/data-source.ts` load du entity moi. Neu them test, Jest cau hinh tim file `*.spec.ts` trong `src/`.

## Nguyen tac lam viec an toan

- Doc file lien quan truoc khi sua, nhat la khi worktree dang co thay doi.
- Khong revert thay doi cua nguoi khac neu khong duoc yeu cau ro.
- Khong xoa migration, entity, DTO hoac module dang ton tai neu chua chac chan khong con duoc dung.
- Khi thay doi API contract, cap nhat DTO/interface lien quan trong `src/dtos` hoac `src/assets/interface`.
- Neu gap encoding comment cu bi loi dau tieng Viet, khong sua hang loat ngoai pham vi task.
