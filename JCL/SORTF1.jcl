//SORTF1   JOB (ACCT),'RIDE SORT F1',CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*===================================================================*
//* ASSIGNMENT 1: JCL SORT (DATA SANITIZER FOR FILE1 - TRIP DATA)     *
//* Reads raw FILE1_TRIP_DATA, removes duplicates, and sorts ascending*
//* by Trip ID (Columns 13-20, Character, Ascending).                *
//*===================================================================*
//STEP01   EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=&SYSUID..RIDE.FILE1.RAW,DISP=SHR
//SORTOUT  DD DSN=&SYSUID..RIDE.FILE1.SORTED,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//SYSIN    DD *
  SORT FIELDS=(13,8,CH,A)
  SUM FIELDS=NONE
/*
//
