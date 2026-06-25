import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { TBLocation } from './location.entity';

@Entity('tb_location_favourite')
export class TBLocationFavourite {
  @PrimaryColumn({ type: 'int', nullable: false })
  userId: number;
  @PrimaryColumn({ type: 'int', nullable: false })
  locationId: number;

  @ManyToOne(() => TBLocation, (location) => location.favourites)
  @JoinColumn({ name: 'locationId' })
  location: TBLocation;
}
