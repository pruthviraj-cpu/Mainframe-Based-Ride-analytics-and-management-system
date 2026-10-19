//RUNREXX  JOB (ACCT),'RUN REXX DEDUP',CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*===================================================================*
//* ASSIGNMENT 3: BATCH EXECUTION OF REXX DEDUPLICATION & SORT SCRIPT *
//* Runs DEDUPF2 via IKJEFT01 (TSO batch executor).                   *
//*===================================================================*
//STEP01   EXEC PGM=IKJEFT01
//SYSPROC  DD DSN=&SYSUID..RIDE.REXX,DISP=SHR
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  %DEDUPF2
/*
//INFILE   DD DSN=&SYSUID..RIDE.FILE2.RAW,DISP=SHR
//OUTFILE  DD DSN=&SYSUID..RIDE.FILE2.SORTED,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//
