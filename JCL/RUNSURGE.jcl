//RUNSURGE JOB (ACCT),'SURGE ANALYTICS',CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*===================================================================*
//* RUN SURGE PRICING REXX ANALYTICS SCRIPT (BATCH IKJEFT01)          *
//* Reads sanitized Trip Data (FILE1.SORTED) and generates surge      *
//* pricing demand report to SURGE.REPORT.                           *
//*===================================================================*
//STEP01   EXEC PGM=IKJEFT01
//SYSPROC  DD DSN=&SYSUID..RIDE.REXX,DISP=SHR
//SYSTSPRT DD SYSOUT=*
//SYSTSIN  DD *
  %SURGEPRC
/*
//TRIPIN   DD DSN=&SYSUID..RIDE.FILE1.SORTED,DISP=SHR
//SURGEOUT DD DSN=&SYSUID..RIDE.SURGE.REPORT,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(5,5),RLSE),
//            DCB=(RECFM=FB,LRECL=80,BLKSIZE=0)
//
