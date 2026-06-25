import { Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_location_favourite')
export class TBLocationFavourite {
  @PrimaryColumn({ type: 'int', nullable: false })
  userId: number;
  @PrimaryColumn({ type: 'int', nullable: false })
  locationId: number;
}
