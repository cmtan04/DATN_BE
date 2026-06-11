import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tb_location_availability')
export class TBLocationAvailability {
  @PrimaryColumn({ type: 'int' })
  locationId: number;

  @PrimaryColumn({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'int', default: 0 })
  bookedCount: number;
}
