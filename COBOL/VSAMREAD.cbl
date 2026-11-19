       IDENTIFICATION DIVISION.
       PROGRAM-ID.    VSAMREAD.
       AUTHOR.        PRUTHVIRAJ GAWANDE.
      *================================================================*
      * PURPOSE: DEMONSTRATE RANDOM KEYED LOOKUP ON VSAM KSDS CLUSTER  *
      * PRIMARY KEY: TRIP-ID (8 BYTES AT OFFSET 0)                     *
      *================================================================*
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT VSAM-FILE ASSIGN TO RIDEVSAM
               ORGANIZATION IS INDEXED
               ACCESS MODE  IS RANDOM
               RECORD KEY   IS VSAM-TRIP-ID
               FILE STATUS  IS WS-VSAM-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD  VSAM-FILE.
       01  VSAM-RECORD.
           05  VSAM-TRIP-ID        PIC X(8).
           05  VSAM-DRIVER-ID      PIC X(8).
           05  VSAM-TIMESTAMP      PIC X(12).
           05  VSAM-PICKUP-ZONE    PIC X(3).
           05  VSAM-DROPOFF-ZONE   PIC X(3).
           05  VSAM-DISTANCE       PIC 9(4)V99.
           05  VSAM-DURATION       PIC 9(4).
           05  VSAM-FARE           PIC 9(4)V99.
           05  VSAM-PAYOUT         PIC 9(4)V99.
           05  VSAM-COMMISSION     PIC 9(4)V99.
           05  VSAM-STATUS-FLAG    PIC X(10).
           05  FILLER              PIC X(4).

       WORKING-STORAGE SECTION.
       01  WS-VSAM-STATUS          PIC X(2) VALUE "00".
       01  WS-SEARCH-TRIP-ID       PIC X(8) VALUE "TR000042".
       01  WS-FORMATTED-FARE       PIC Z,ZZ9.99.
       01  WS-FORMATTED-PAYOUT     PIC Z,ZZ9.99.
       01  WS-FORMATTED-COMM       PIC Z,ZZ9.99.

       PROCEDURE DIVISION.
       0000-MAIN.
           DISPLAY "================================================="
           DISPLAY "  IBM z/OS VSAM KSDS DIRECT KEYED ACCESS ENGINE  "
           DISPLAY "================================================="

           OPEN INPUT VSAM-FILE
           IF WS-VSAM-STATUS NOT = "00"
               DISPLAY "ERROR OPENING VSAM KSDS. STATUS: "
                       WS-VSAM-STATUS
               STOP RUN
           END-IF

      *    PERFORM DIRECT KEYED READ (O(1) RANDOM ACCESS VIA B-TREE)
           MOVE WS-SEARCH-TRIP-ID TO VSAM-TRIP-ID
           DISPLAY "QUERYING PRIMARY KEY: [" VSAM-TRIP-ID "]"

           READ VSAM-FILE
               INVALID KEY
                   DISPLAY ">> RESULT: TRIP NOT FOUND IN VSAM CLUSTER <<"
                   DISPLAY "   STATUS CODE: " WS-VSAM-STATUS
               NOT INVALID KEY
                   MOVE VSAM-FARE       TO WS-FORMATTED-FARE
                   MOVE VSAM-PAYOUT     TO WS-FORMATTED-PAYOUT
                   MOVE VSAM-COMMISSION TO WS-FORMATTED-COMM
                   DISPLAY ">> RESULT: SUCCESSFUL VSAM KSDS HIT! <<"
                   DISPLAY "   TRIP ID      : " VSAM-TRIP-ID
                   DISPLAY "   DRIVER ID    : " VSAM-DRIVER-ID
                   DISPLAY "   TIMESTAMP    : " VSAM-TIMESTAMP
                   DISPLAY "   PICKUP/DROP  : " VSAM-PICKUP-ZONE " -> "
                                                VSAM-DROPOFF-ZONE
                   DISPLAY "   GROSS FARE   : $" WS-FORMATTED-FARE
                   DISPLAY "   80% PAYOUT   : $" WS-FORMATTED-PAYOUT
                   DISPLAY "   20% COMM     : $" WS-FORMATTED-COMM
                   DISPLAY "   STATUS       : " VSAM-STATUS-FLAG
           END-READ

           CLOSE VSAM-FILE
           DISPLAY "================================================="
           GOBACK.
