//ALLOCRID JOB 1,CLASS=A,MSGLEVEL=(1,1),NOTIFY=&SYSUID
//* ------------------------------------------------------------------
//* ALLOCATE MISSING RIDE DATASETS ON VOLUME ZXPC02
//* ------------------------------------------------------------------
//CLEANUP  EXEC PGM=IEFBR14
//DD3      DD DSN=Z73984.RIDE.FILE3.LEDGER,
//            DISP=(MOD,DELETE),SPACE=(TRK,0)
//DD4      DD DSN=Z73984.RIDE.FILE4.FRAUD,
//            DISP=(MOD,DELETE),SPACE=(TRK,0)
//DD5      DD DSN=Z73984.RIDE.FILE5.SUMMARY,
//            DISP=(MOD,DELETE),SPACE=(TRK,0)
//* ------------------------------------------------------------------
//ALLOC    EXEC PGM=IEFBR14
//DD3      DD DSN=Z73984.RIDE.FILE3.LEDGER,
//            DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(5,2)),VOL=SER=ZXPC02,
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=800)
//DD4      DD DSN=Z73984.RIDE.FILE4.FRAUD,
//            DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(5,2)),VOL=SER=ZXPC02,
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=800)
//DD5      DD DSN=Z73984.RIDE.FILE5.SUMMARY,
//            DISP=(NEW,CATLG,DELETE),SPACE=(TRK,(5,2)),VOL=SER=ZXPC02,
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=800)
