//POPSEQ   JOB 1,CLASS=A,MSGLEVEL=(1,1),NOTIFY=&SYSUID
//* ------------------------------------------------------------------
//* COPY VSAM KSDS RECORDS TO SEQUENTIAL DATASET FILE3.LEDGER
//* ------------------------------------------------------------------
//REPROSTP EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  REPRO INDATASET(Z73984.RIDE.FILE3.VSAM) -
        OUTDATASET(Z73984.RIDE.FILE3.LEDGER)
/*
